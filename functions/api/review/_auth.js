const encoder = new TextEncoder();
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;

function readCookie(request, name) {
  const prefix = `${name}=`;
  return (request.headers.get("Cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function hex(bytes) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEquals(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function verifyReviewSession(request, secret) {
  if (!secret) return false;

  const value = readCookie(request, "pundent_review");
  const [expiresAt, signature] = String(value || "").split(".");
  const expiry = Number(expiresAt);

  if (!/^\d+$/.test(expiresAt || "") || !/^[a-f0-9]{64}$/.test(signature || "")) {
    return false;
  }
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedSignature = await sign(`review:${expiresAt}`, secret);
  return constantTimeEquals(signature, expectedSignature);
}

export async function createReviewSession(secret) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const signature = await sign(`review:${expiresAt}`, secret);
  return `pundent_review=${expiresAt}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_LIFETIME_SECONDS}`;
}

export function clearReviewSession() {
  return "pundent_review=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
}

export function passwordsMatch(candidate, secret) {
  return constantTimeEquals(candidate, secret);
}
