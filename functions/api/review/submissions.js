import { verifyReviewSession } from "./_auth.js";

function unauthorized() {
  return Response.json({ error: "Review sign-in required." }, { status: 401 });
}

export async function onRequestGet(context) {
  if (!(await verifyReviewSession(context.request, context.env.REVIEW_PASSWORD))) {
    return unauthorized();
  }

  const searchText = (new URL(context.request.url).searchParams.get("q") || "").trim();
  if (searchText.length > 80) {
    return Response.json({ error: "Search text can be at most 80 characters." }, { status: 400 });
  }

  // Escape SQLite LIKE's special characters so a search is literal text,
  // rather than allowing % or _ to turn into an accidental broad search.
  const escapedSearchText = searchText.replace(/[\\%_]/g, "\\$&");
  const submissionQuery = searchText
    ? context.env.PUNS_DB.prepare(
      `SELECT submission_id, pun_text, submitted_by, submitted_on, status
       FROM submissions
       WHERE LOWER(pun_text) LIKE ? ESCAPE '\\'
       ORDER BY submission_id`,
    ).bind(`%${escapedSearchText.toLowerCase()}%`)
    : context.env.PUNS_DB.prepare(
      `SELECT submission_id, pun_text, submitted_by, submitted_on, status
       FROM submissions
       WHERE status = 'pending'
       ORDER BY submission_id`,
    );

  const [submissions, topics] = await context.env.PUNS_DB.batch([
    submissionQuery,
    context.env.PUNS_DB.prepare(
      `SELECT topic_id, topic_text
       FROM topics
       ORDER BY topic_text COLLATE NOCASE`,
    ),
  ]);

  return Response.json({
    submissions: submissions.results,
    topics: topics.results,
    searchText,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPatch(context) {
  if (!(await verifyReviewSession(context.request, context.env.REVIEW_PASSWORD))) {
    return unauthorized();
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Please try that review again." }, { status: 400 });
  }

  const submissionId = Number(body.submissionId);
  const action = String(body.action || "");
  const reviewerNote = String(body.reviewerNote || "").trim();
  const topicId = Number(body.topicId);

  if (!Number.isInteger(submissionId) || submissionId < 1 || !["approve", "decline"].includes(action)) {
    return Response.json({ error: "That review request is not valid." }, { status: 400 });
  }
  if (reviewerNote.length > 500) {
    return Response.json({ error: "A reviewer note can be at most 500 characters." }, { status: 400 });
  }
  if (action === "approve" && (!Number.isInteger(topicId) || topicId < 1)) {
    return Response.json({ error: "Choose a topic before approving a pun." }, { status: 400 });
  }

  const pending = await context.env.PUNS_DB.prepare(
    "SELECT submission_id FROM submissions WHERE submission_id = ? AND status = 'pending'",
  ).bind(submissionId).first();
  if (!pending) {
    return Response.json({ error: "That submission is no longer pending review." }, { status: 409 });
  }

  if (action === "decline") {
    await context.env.PUNS_DB.prepare(
      `UPDATE submissions
       SET status = 'declined', reviewed_on = CURRENT_TIMESTAMP, reviewer_note = ?
       WHERE submission_id = ?`,
    ).bind(reviewerNote || null, submissionId).run();
    return Response.json({ message: "The submission was declined." });
  }

  const topic = await context.env.PUNS_DB.prepare(
    "SELECT topic_id FROM topics WHERE topic_id = ?",
  ).bind(topicId).first();
  if (!topic) {
    return Response.json({ error: "Choose one of the listed topics." }, { status: 400 });
  }

  await context.env.PUNS_DB.batch([
    context.env.PUNS_DB.prepare(
      `UPDATE submissions
       SET status = 'approved', reviewed_on = CURRENT_TIMESTAMP, reviewer_note = ?
       WHERE submission_id = ?`,
    ).bind(reviewerNote || null, submissionId),
    context.env.PUNS_DB.prepare(
      "INSERT INTO puns (submission_id) VALUES (?)",
    ).bind(submissionId),
    context.env.PUNS_DB.prepare(
      `INSERT INTO puns_to_topics (pun_id, topic_id)
       SELECT pun_id, ? FROM puns WHERE submission_id = ?`,
    ).bind(topicId, submissionId),
  ]);

  return Response.json({ message: "Approved, published, and assigned a topic." });
}
