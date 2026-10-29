import { Elysia } from "elysia";
import cookie from "@elysiajs/cookie";
import { authRoute } from "./routes/auth";
import { healthRoute } from "./routes/health";

export const app = new Elysia()
  .use(cookie())
  .use(authRoute)
  .use(healthRoute);
