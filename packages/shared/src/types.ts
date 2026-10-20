import * as schemas from "./schemas/auth";
import * as caseSchemas from "./schemas/case";
export type RegisterInput = import("zod").infer<typeof schemas.registerSchema>;
export type CreateCaseInput = import("zod").infer<typeof caseSchemas.createCaseSchema>;
export type UpdateCaseInput = import("zod").infer<typeof caseSchemas.updateCaseSchema>;
