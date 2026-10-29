import { Elysia, t } from "elysia";
import { createCaseSchema, updateCaseSchema } from "@campbridge/shared";
import { addCaseNote, createCase, getCase, listCaseNotes, listCases, updateCase } from "../services/case.service";
import { requireUser } from "../middleware/role";

const query = t.Object({
  status: t.Optional(t.String()),
  urgency: t.Optional(t.String()),
  category: t.Optional(t.String()),
  assignedTo: t.Optional(t.String()),
  createdBy: t.Optional(t.String()),
  q: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export const casesRoute = new Elysia({ prefix: "/api/cases" })
  .get("/", ({ query, user }: any) => {
    const current = requireUser(user);
    return listCases(query, current);
  }, { query })
  .post("/", ({ body, user }: any) => {
    const current = requireUser(user);
    return createCase(createCaseSchema.parse(body), current.id);
  }, { body: t.Any() })
  .get("/:id", ({ params, user }: any) => getCase(params.id, requireUser(user)))
  .patch("/:id", ({ body, params, user }: any) => updateCase(params.id, updateCaseSchema.parse(body), requireUser(user)), { body: t.Any() })
  .post("/:id/notes", ({ body, params, user }: any) => addCaseNote(params.id, requireUser(user), body.note), {
    body: t.Object({ note: t.String({ minLength: 1 }) }),
  })
  .get("/:id/notes", ({ params, user }: any) => listCaseNotes(params.id, requireUser(user)));
