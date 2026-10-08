import { createGroanVisitorCookie, getGroanVisitorToken } from "../../_groans.js";

export async function onRequestPost(context) {
  const requestOrigin = context.request.headers.get("Origin");
  const siteOrigin = new URL(context.request.url).origin;
  if (requestOrigin && requestOrigin !== siteOrigin) {
    return Response.json({ error: "Groans must come from the Department of Puns site." }, { status: 403 });
  }

  const punId = Number(context.params.punId);
  if (!Number.isSafeInteger(punId) || punId < 1) {
    return Response.json({ error: "That pun could not be found." }, { status: 404 });
  }

  const db = context.env.PUNS_DB;
  const publishedPun = await db.prepare(
    "SELECT pun_id FROM puns WHERE pun_id = ? AND is_active = 1",
  ).bind(punId).first();
  if (!publishedPun) {
    return Response.json({ error: "That pun is not available for groaning." }, { status: 404 });
  }

  let visitorToken = getGroanVisitorToken(context.request);
  const setVisitorCookie = !visitorToken;
  if (!visitorToken) visitorToken = crypto.randomUUID();

  const result = await db.prepare(
    `INSERT OR IGNORE INTO pun_groans (pun_id, visitor_token)
     VALUES (?, ?)`,
  ).bind(punId, visitorToken).run();
  const count = await db.prepare(
    "SELECT COUNT(*) AS groan_count FROM pun_groans WHERE pun_id = ?",
  ).bind(punId).first();

  const headers = new Headers({ "Cache-Control": "no-store" });
  if (setVisitorCookie) headers.set("Set-Cookie", createGroanVisitorCookie(visitorToken));
  return Response.json({
    punId,
    groanCount: Number(count?.groan_count || 0),
    added: Number(result.meta?.changes || 0) === 1,
  }, { headers });
}
