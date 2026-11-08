import { Elysia } from "elysia";
import { requireRole } from "../middleware/role";
import { listVolunteers } from "../services/user.service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .get("/volunteers", ({ user }: any) => {
    requireRole(user, ["team_lead"]);
    return listVolunteers();
  });
