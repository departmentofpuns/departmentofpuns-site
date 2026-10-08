import { getGroanVisitorToken } from "./_groans.js";

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
  const visitorToken = getGroanVisitorToken(context.request) || "";
  const statement = context.env.PUNS_DB.prepare(
    `SELECT
       p.pun_id,
       s.pun_text,
       s.submitted_by,
       GROUP_CONCAT(t.topic_text, '|') AS topics,
       (SELECT COUNT(*) FROM pun_groans AS g WHERE g.pun_id = p.pun_id) AS groan_count,
       EXISTS(
         SELECT 1 FROM pun_groans AS g
         WHERE g.pun_id = p.pun_id AND g.visitor_token = ?
       ) AS has_groaned
     FROM puns AS p
     JOIN submissions AS s ON s.submission_id = p.submission_id
     JOIN puns_to_topics AS pt ON pt.pun_id = p.pun_id
     JOIN topics AS t ON t.topic_id = pt.topic_id
     WHERE p.is_active = 1
       ${searchClause}
     GROUP BY p.pun_id, s.pun_text, s.submitted_by
     ORDER BY MAX(p.published_on) DESC, p.pun_id DESC`,
  );
  const values = [visitorToken];
  if (searchText) values.push(`%${escapedSearchText.toLowerCase()}%`);
  const { results } = await statement.bind(...values).all();

  const puns = results.map((pun) => ({
    id: pun.pun_id,
    text: pun.pun_text,
    submittedBy: pun.submitted_by || null,
    topics: pun.topics.split('|'),
    groanCount: Number(pun.groan_count || 0),
    hasGroaned: Number(pun.has_groaned) === 1,
  }));

  return Response.json({ puns, searchText }, {
    headers: { "Cache-Control": "no-store" },
  });
}
