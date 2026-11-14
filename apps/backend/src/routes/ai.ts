import { Elysia, t } from "elysia";
import { anonymizeSchema, caseIntakeSchema, followUpSchema, triageSchema } from "@campbridge/shared";
import { requireUser } from "../middleware/role";
import { anonymize, caseIntake, followUp, triage } from "../services/ai/ai.service";

export const aiRoute = new Elysia({ prefix: "/api/ai" })
  .post("/case-intake", async ({ body, user, set }: any) => {
    requireUser(user);
    const input = caseIntakeSchema.parse(body);
    try {
      return await caseIntake(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "SAMPLE_NOT_FOUND" || message === "TEXT_REQUIRED") {
        set.status = 400;
        return { error: { message: message === "SAMPLE_NOT_FOUND" ? "Unknown sampleId" : "Provide banglaText, sampleId or audio", code: "VALIDATION_ERROR" } };
      }
      if (message === "AUDIO_REQUIRES_GEMINI") {
        set.status = 400;
        return { error: { message: "Audio intake requires GEMINI_API_KEY; use banglaText or sampleId", code: "AI_UNAVAILABLE" } };
      }
      throw error;
    }
  }, { body: t.Any() })
  .post("/triage", ({ body, user }: any) => {
    requireUser(user);
    return triage(triageSchema.parse(body).text);
  }, { body: t.Any() })
  .post("/anonymize", ({ body, user }: any) => {
    requireUser(user);
    const input = anonymizeSchema.parse(body);
    return anonymize(input.text, input.useGemini);
  }, { body: t.Any() })
  .post("/follow-up", ({ body, user }: any) => {
    requireUser(user);
    const input = followUpSchema.parse(body);
    return followUp(input.summary, input.category);
  }, { body: t.Any() });
