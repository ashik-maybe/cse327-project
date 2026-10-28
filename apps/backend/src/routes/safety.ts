import { Elysia } from "elysia"
import { safetyApi } from "../services/safety"
import { z } from "zod"
import { safetyApi } from "../services/safety"
import { requireRole } from "../middleware/role"
import { authMiddleware } from "../middleware/auth"

const safetySchema = z.object({
  incidentType: z.enum(["threat", "harassment", "other"]),
  anonymizedDescription: z.string(),
  originalDescription: z.string().optional(),
  storeOriginal: z.boolean().optional(),
  approximateLocation: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
})

export const safetyRoute = new Elysia({ prefix: "/api/safety" })
  .use(authMiddleware)
  .get("/", async ({ query }: any) => {
    const filters = {
      status: query.status,
      urgency: query.urgency,
      createdBy: query.createdBy,
      page: parseInt(query.page as string) || 1,
      limit: parseInt(query.limit as string) || 20,
    }
    return await safetyApi.listSafetyReports(filters)
  }, {
    params: z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).optional(),
      status: z.string().optional(),
      urgency: z.string().optional(),
      createdBy: z.string().optional(),
    })
  })
  .post("/", async ({ body }: any) => {
    const input = safetySchema.parse(body)
    return await safetyApi.createSafetyReport(input)
  }, { body: safetySchema })
  .get("/:id", async ({ params }: any) => {
    return await safetyApi.getSafetyReport(params.id)
  })
  .patch("/:id", async ({ params, body }: any) => {
    const input = safetySchema.partial().parse(body)
    return await safetyApi.updateSafetyReportStatus(params.id, input.status)
  })