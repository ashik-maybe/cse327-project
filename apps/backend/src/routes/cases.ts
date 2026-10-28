import { Elysia } from "elysia";
import { listCases, createCase, getCase, updateCase, addCaseNote, listCaseNotes } from "../services/case.service";
import { z } from "zod";
import { createCaseSchema, updateCaseSchema, listCasesSchema } from "@campbridge/shared";
import { requireRole } from "../middleware/role";
import { authMiddleware } from "../middleware/auth";

export const casesRoute = new Elysia({ prefix: "/api/cases" })
  .use(authMiddleware)
  .get("/", async ({ query }: any) => {
    const filters = {
      scope: query.scope as "mine" | "team" | undefined,
      status: query.status,
      urgency: query.urgency,
      category: query.category,
      assignedTo: query.assignedTo,
      createdBy: query.createdBy,
      q: query.q,
      page: parseInt(query.page as string) || 1,
      limit: parseInt(query.limit as string) || 20,
      userId: query.userId,
      userRole: query.role,
    };
    return await listCases(filters);
  }, {
    params: z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).optional(),
      scope: z.enum(["mine", "team"]).optional(),
      status: z.string().optional(),
      urgency: z.string().optional(),
      category: z.string().optional(),
      assignedTo: z.string().optional(),
      createdBy: z.string().optional(),
      q: z.string().optional(),
      limit: z.number().min(1).optional(),
    })
  })
  .post("/", async ({ body, userId }: any) => {
    const input = body as typeof createCaseSchema;
    return await createCase(input, userId);
  }, {
    body: createCaseSchema,
  })
  .get("/:id", async ({ params }: any) => {
    return await getCase(params.id);
  })
  .patch("/:id", async ({ body, params, userId }: any) => {
    const input = body as typeof updateCaseSchema;
    return await updateCase(params.id, input);
  }, {
    body: updateCaseSchema,
  })
  .post("/:id/notes", async ({ body, params, userId }: any) => {
    const note = await addCaseNote(params.id, userId, body.note);
    return note;
  })
  .get("/:id/notes", async ({ params }: any) => {
    return await listCaseNotes(params.id);
  });