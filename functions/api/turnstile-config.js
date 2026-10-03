export function onRequestGet(context) {
  const siteKey = context.env.TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return Response.json(
      { error: "Spam protection is not configured." },
      { status: 503 },
    );
  }

  // A Turnstile site key is intentionally public. The paired secret remains
  // available only to server-side Pages Functions.
  return Response.json(
    { siteKey },
    { headers: { "Cache-Control": "no-store" } },
  );
}
