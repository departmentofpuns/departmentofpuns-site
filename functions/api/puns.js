export async function onRequestGet(context) {
  const searchText = (new URL(context.request.url).searchParams.get("q") || "").trim();
  if (searchText.length > 80) {
    return Response.json({ error: "Search text can be at most 80 characters." }, { status: 400 });
  }

  // Escape SQLite LIKE's special characters so a public search is literal
  // text, rather than treating % or _ as a wildcard.
  const escapedSearchText = searchText.replace(/[\\%_]/g, "\\$&");
  const searchClause = searchText
    ? `AND LOWER(s.pun_text) LIKE ? ESCAPE '\\'`
    : "";
  const statement = context.env.PUNS_DB.prepare(
    `SELECT
       p.pun_id,
       s.pun_text,
       s.submitted_by,
       GROUP_CONCAT(t.topic_text, '|') AS topics
     FROM puns AS p
     JOIN submissions AS s ON s.submission_id = p.submission_id
     JOIN puns_to_topics AS pt ON pt.pun_id = p.pun_id
     JOIN topics AS t ON t.topic_id = pt.topic_id
     WHERE p.is_active = 1
       ${searchClause}
     GROUP BY p.pun_id, s.pun_text, s.submitted_by
     ORDER BY MAX(p.published_on) DESC, p.pun_id DESC`,
  );
  const { results } = await (searchText
    ? statement.bind(`%${escapedSearchText.toLowerCase()}%`)
    : statement
  ).all();

  const puns = results.map((pun) => ({
    id: pun.pun_id,
    text: pun.pun_text,
    submittedBy: pun.submitted_by || null,
    topics: pun.topics.split('|'),
  }));

  return Response.json({ puns, searchText }, {
    headers: { "Cache-Control": "no-store" },
  });
}
