const COOKIE_NAME = "pun_groan_visitor";

export function getGroanVisitorToken(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : null;
}

export function createGroanVisitorCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`;
}
