export async function onRequestGet(context) {
  const { results } = await context.env.PUNS_DB.prepare(
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
     GROUP BY p.pun_id, s.pun_text, s.submitted_by
     ORDER BY MAX(p.published_on) DESC, p.pun_id DESC`,
  ).all();

  const puns = results.map((pun) => ({
    id: pun.pun_id,
    text: pun.pun_text,
    submittedBy: pun.submitted_by || null,
    topics: pun.topics.split('|'),
  }));

  return Response.json({ puns }, {
    headers: { "Cache-Control": "no-store" },
  });
}
