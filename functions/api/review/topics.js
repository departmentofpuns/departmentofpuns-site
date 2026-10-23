import { verifyReviewSession } from "./_auth.js";

function unauthorized() {
  return Response.json({ error: "Review sign-in required." }, { status: 401 });
}

export async function onRequestPost(context) {
  if (!(await verifyReviewSession(context.request, context.env.REVIEW_PASSWORD))) {
    return unauthorized();
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Please enter a topic name." }, { status: 400 });
  }

  const topicText = String(body.topicText || "").trim().replace(/\s+/g, " ");
  if (topicText.length < 2 || topicText.length > 80) {
    return Response.json({ error: "A topic must be between 2 and 80 characters." }, { status: 400 });
  }

  try {
    const result = await context.env.PUNS_DB.prepare(
      "INSERT INTO topics (topic_text) VALUES (?) RETURNING topic_id, topic_text",
    ).bind(topicText).first();
    return Response.json({ topic: result }, { status: 201 });
  } catch (error) {
    if (String(error.message || error).toLowerCase().includes("unique")) {
      return Response.json({ error: "That topic already exists." }, { status: 409 });
    }
    throw error;
  }
}
