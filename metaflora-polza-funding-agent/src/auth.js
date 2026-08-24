import { createHmac, timingSafeEqual } from "node:crypto";

function same(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function bearerAuthorized(header, token) {
  const match = /^Bearer\s+(.+)$/iu.exec(String(header ?? ""));
  return Boolean(match && same(match[1], token));
}

export function basicAuthorized(header, user, password) {
  const match = /^Basic\s+(.+)$/iu.exec(String(header ?? ""));
  if (!match) return false;
  let decoded = "";
  try { decoded = Buffer.from(match[1], "base64").toString("utf8"); } catch { return false; }
  const separator = decoded.indexOf(":");
  return separator > -1 && same(decoded.slice(0, separator), user) && same(decoded.slice(separator + 1), password);
}

export function browserSessionToken(user, password) {
  return createHmac("sha256", password).update(`funding-browser:${user}:v1`).digest("base64url");
}

export function browserSessionAuthorized(cookieHeader, user, password) {
  const expected = browserSessionToken(user, password);
  const value = String(cookieHeader ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith("funding_browser_session="))?.split("=").slice(1).join("=");
  return Boolean(value && same(value, expected));
}
