import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "campbridge-development-secret";

function signature(userId: string) {
  return createHmac("sha256", SESSION_SECRET).update(userId).digest("base64url");
}

export function createSession(userId: string) {
  return `${userId}.${signature(userId)}`;
}

export function verifySession(value: string | undefined) {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const userId = value.slice(0, separator);
  const provided = value.slice(separator + 1);
  const expected = signature(userId);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  return userId;
}

export function cookieValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value && typeof value.value === "string") {
    return value.value;
  }
  return undefined;
}
