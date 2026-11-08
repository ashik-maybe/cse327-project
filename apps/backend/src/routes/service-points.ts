import { Elysia, t } from "elysia";
import { createServicePointSchema, updateServicePointSchema } from "@campbridge/shared";
import { requireRole, requireUser } from "../middleware/role";
import { createServicePoint, deleteServicePoint, listServicePoints, updateServicePoint } from "../services/service-point.service";

const pointBody = t.Any();

export const servicePointsRoute = new Elysia({ prefix: "/api/service-points" })
  .get(
    "/",
    ({ query, user }: any) => {
      const current = requireUser(user);
      return listServicePoints({
        category: query.category,
        includeInactive: query.includeInactive === "true" && current.role === "team_lead",
      });
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        includeInactive: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/",
    ({ body, user }: any) => {
      requireRole(user, ["team_lead"]);
      return createServicePoint(createServicePointSchema.parse(body));
    },
    { body: pointBody }
  )
  .patch(
    "/:id",
    ({ body, params, user }: any) => {
      requireRole(user, ["team_lead"]);
      return updateServicePoint(params.id, updateServicePointSchema.parse(body));
    },
    { body: pointBody }
  )
  .delete("/:id", ({ params, user }: any) => {
    requireRole(user, ["team_lead"]);
    return deleteServicePoint(params.id);
  });
