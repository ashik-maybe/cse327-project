export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 10000),
  authCookieName: process.env.AUTH_COOKIE_NAME ?? "campbridge_session",
};
