import { Elysia } from "elysia";
import { requireUser } from "../middleware/role";
import { getDashboardSummary } from "../services/dashboard.service";

export const dashboardRoute = new Elysia({ prefix: "/api/dashboard" }).get("/summary", ({ user }: any) =>
  getDashboardSummary(requireUser(user))
);
