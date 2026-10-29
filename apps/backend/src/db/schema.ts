import { pgTable, uuid, text, timestamp, boolean, doublePrecision, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["volunteer", "team_lead"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id"),
  createdBy: uuid("created_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  summary: text("summary").notNull(),
  description: text("description"),
  category: text("category", { enum: ["shelter", "protection", "food", "wash", "health", "other"] }).notNull(),
  urgency: text("urgency", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["new", "in_progress", "referred", "resolved"] }).default("new"),
  locationName: text("location_name"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  nextContact: text("next_contact"),
  source: text("source", { enum: ["manual", "voice"] }).default("manual"),
  aiAssisted: boolean("ai_assisted").default(false),
  aiSource: text("ai_source"),
  clientCreatedAt: timestamp("client_created_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ uniqClient: uniqueIndex("cases_created_by_client_id").on(t.createdBy, t.clientId) }));

export const caseNotes = pgTable("case_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id").references(() => cases.id),
  userId: uuid("user_id").references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const safetyReports = pgTable("safety_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id"),
  createdBy: uuid("created_by").references(() => users.id),
  incidentType: text("incident_type", { enum: ["threat", "harassment", "other"] }).notNull(),
  anonymizedDescription: text("anonymized_description").notNull(),
  originalDescription: text("original_description"),
  storeOriginal: boolean("store_original").default(false),
  approximateLocation: text("approximate_location"),
  urgency: text("urgency", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["new", "acknowledged", "resolved"] }).default("new"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({ uniqSafetyClient: uniqueIndex("safety_created_by_client_id").on(t.createdBy, t.clientId) }));

export const servicePoints = pgTable("service_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  area: text("area"),
  description: text("description"),
  contactNote: text("contact_note"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  openingHours: text("opening_hours"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
