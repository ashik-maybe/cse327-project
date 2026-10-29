import { Elysia, t } from "elysia";
import { createSafetySchema, updateSafetySchema } from "@campbridge/shared";
import { requireUser } from "../middleware/role";
import { createSafetyReport, getSafetyReport, listSafetyReports, updateSafetyReportStatus } from "../services/safety";

export const safetyRoute = new Elysia({ prefix: "/api/safety" })
  .get("/", ({ query, user }: any) => listSafetyReports(query, requireUser(user)), {
    query: t.Object({
      status: t.Optional(t.String()),
      urgency: t.Optional(t.String()),
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
    }),
  })
  .post("/", ({ body, user }: any) => {
    const input = createSafetySchema.parse(body);
    return createSafetyReport({
      incidentType: input.incidentType,
      anonymizedDescription: input.anonymizedDescription,
      originalDescription: input.storeOriginal ? input.originalDescription : undefined,
      storeOriginal: input.storeOriginal ?? false,
      approximateLocation: input.approximateLocation,
      urgency: input.urgency,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    }, requireUser(user).id);
  }, { body: t.Any() })
  .get("/:id", ({ params, user }: any) => getSafetyReport(params.id, requireUser(user)))
  .patch("/:id", ({ params, body, user }: any) => updateSafetyReportStatus(params.id, updateSafetySchema.parse(body).status, requireUser(user)), {
    body: t.Object({ status: t.Union([t.Literal("new"), t.Literal("acknowledged"), t.Literal("resolved")]) }),
  });
