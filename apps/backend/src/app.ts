import { Elysia } from "elysia";
import cookie from "@elysiajs/cookie";
import { ZodError } from "zod";
import { authRoute } from "./routes/auth";
import { healthRoute } from "./routes/health";
import { casesRoute } from "./routes/cases";
import { dashboardRoute } from "./routes/dashboard";
import { safetyRoute } from "./routes/safety";
import { servicePointsRoute } from "./routes/service-points";
import { usersRoute } from "./routes/users";
import { getAuthenticatedUser } from "./middleware/auth";
import { cookieValue } from "./utils/session";

export const app = new Elysia()
  .use(cookie())
  .derive(async ({ cookie: cookies }) => ({
    user: await getAuthenticatedUser(cookieValue(cookies?.campbridge_session)),
  }))
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: { message: error.message, code: "VALIDATION_ERROR" } };
    }
    if (error instanceof ZodError) {
      set.status = 400;
      return { error: { message: error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" } };
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      set.status = 401;
      return { error: { message: "Authentication required", code: "UNAUTHORIZED" } };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      set.status = 403;
      return { error: { message: "Insufficient permissions", code: "FORBIDDEN" } };
    }
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      set.status = 401;
      return { error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } };
    }
    if (error instanceof Error && error.message === "INVALID_ASSIGNEE") {
      set.status = 400;
      return { error: { message: "Assignee must be a volunteer", code: "INVALID_ASSIGNEE" } };
    }
    set.status = 500;
    return { error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  })
  .use(authRoute)
  .use(healthRoute)
  .use(casesRoute)
  .use(dashboardRoute)
  .use(safetyRoute)
  .use(servicePointsRoute)
  .use(usersRoute);
