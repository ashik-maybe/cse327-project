import * as schemas from "./schemas/auth";
import * as caseSchemas from "./schemas/case";
import * as safetySchemas from "./schemas/safety";
export type RegisterInput = import("zod").infer<typeof schemas.registerSchema>;
export type CreateCaseInput = import("zod").infer<typeof caseSchemas.createCaseSchema>;
export type UpdateCaseInput = import("zod").infer<typeof caseSchemas.updateCaseSchema>;
export type CreateSafetyInput = import("zod").infer<typeof safetySchemas.createSafetySchema>;
export type UpdateSafetyInput = import("zod").infer<typeof safetySchemas.updateSafetySchema>;

export type SafetyRecord = {
  id: string;
  incidentType: "threat" | "harassment" | "other";
  anonymizedDescription: string;
  originalDescription?: string | null;
  storeOriginal: boolean;
  approximateLocation?: string | null;
  urgency: "low" | "medium" | "high" | "critical";
  status: "new" | "acknowledged" | "resolved";
  createdAt: string;
  createdBy?: string | null;
};

export type DashboardSummary =
  | {
      role: "volunteer";
      highUrgencyCount: number;
      staleCaseCount: number;
      assignedToMeCount: number;
      recentCaseCount: number;
    }
  | {
      role: "team_lead";
      highUrgencyCount: number;
      staleCaseCount: number;
      unassignedCount: number;
      recentSafetyCount: number;
    };

export type ServicePointRecord = {
  id: string;
  name: string;
  category: string;
  area?: string | null;
  description?: string | null;
  contactNote?: string | null;
  latitude: number;
  longitude: number;
  openingHours?: string | null;
  isActive: boolean;
  createdAt: string;
};
