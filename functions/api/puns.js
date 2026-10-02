export async function onRequestGet(context) {
  const { results } = await context.env.PUNS_DB.prepare(
    `SELECT
       p.pun_id,
       p.pun_text,
       GROUP_CONCAT(t.topic_text, '|') AS topics
     FROM puns AS p
     JOIN puns_to_topics AS pt ON pt.pun_id = p.pun_id
     JOIN topics AS t ON t.topic_id = pt.topic_id
     WHERE p.is_active = 1
     GROUP BY p.pun_id, p.pun_text
     ORDER BY p.pun_id`,
  ).all();

  const puns = results.map((pun) => ({
    id: pun.pun_id,
    text: pun.pun_text,
    topics: pun.topics.split('|'),
  }));

  return Response.json({ puns }, {
    headers: { "Cache-Control": "no-store" },
  });
}
