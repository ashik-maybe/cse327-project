import { Elysia, t } from "elysia";
import { requireRole, requireUser } from "../middleware/role";
import { createServicePoint, deleteServicePoint, listServicePoints, updateServicePoint } from "../services/service-point.service";

const pointBody = t.Object({
  name: t.String(),
  category: t.String(),
  area: t.Optional(t.String()),
  description: t.Optional(t.String()),
  contactNote: t.Optional(t.String()),
  latitude: t.Number(),
  longitude: t.Number(),
  openingHours: t.Optional(t.String()),
});

export const servicePointsRoute = new Elysia({ prefix: "/api/service-points" })
  .get("/", () => listServicePoints())
  .post("/", ({ body, user }: any) => createServicePoint(requireRole(user, ["team_lead"]) && body), { body: pointBody })
  .patch("/:id", ({ body, params, user }: any) => updateServicePoint(params.id, requireRole(user, ["team_lead"]) && body), { body: t.Partial(pointBody) })
  .delete("/:id", ({ params, user }: any) => deleteServicePoint(params.id), { beforeHandle: ({ user }: any) => requireRole(user, ["team_lead"]) });
