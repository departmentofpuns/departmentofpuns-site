import {
  clearReviewSession,
  createReviewSession,
  passwordsMatch,
} from "./_auth.js";

async function verifyTurnstile(token, secret) {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  return response.json();
}

export async function onRequestPost(context) {
  if (!context.env.REVIEW_PASSWORD || !context.env.TURNSTILE_SECRET_KEY) {
    return Response.json({ error: "Review access is not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Please try signing in again." }, { status: 400 });
  }

  const password = String(body.password || "");
  const turnstileToken = String(body.turnstileToken || "");
  if (!password || !turnstileToken) {
    return Response.json({ error: "Enter the password and complete spam protection." }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyTurnstile(turnstileToken, context.env.TURNSTILE_SECRET_KEY);
  } catch {
    return Response.json({ error: "Spam protection is temporarily unavailable." }, { status: 503 });
  }

  if (!verification.success || verification.action !== "review-login") {
    return Response.json({ error: "Spam protection could not verify this sign-in." }, { status: 400 });
  }

  if (!passwordsMatch(password, context.env.REVIEW_PASSWORD)) {
    return Response.json({ error: "That password is not correct." }, { status: 401 });
  }

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": await createReviewSession(context.env.REVIEW_PASSWORD) },
  });
}

export function onRequestDelete() {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": clearReviewSession() },
  });
}
