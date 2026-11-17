import { closeDb, dbClient } from "./client";
import { caseNotes, cases, safetyReports, servicePoints, users } from "./schema";
import { and, eq } from "drizzle-orm";
import { hash } from "../services/auth.service";

await dbClient.insert(users).values([
  { name: "Demo Volunteer", email: "volunteer@campbridge.local", passwordHash: hash("demo1234"), role: "volunteer" },
  { name: "Demo Lead", email: "lead@campbridge.local", passwordHash: hash("lead1234"), role: "team_lead" },
]).onConflictDoNothing({ target: users.email });

const [volunteer] = await dbClient.select().from(users).where(eq(users.email, "volunteer@campbridge.local")).limit(1);
const [lead] = await dbClient.select().from(users).where(eq(users.email, "lead@campbridge.local")).limit(1);
if (!volunteer || !lead) throw new Error("seed users missing after upsert");

for (const point of [
  {
    name: "Health Post",
    category: "health_post",
    latitude: 21.2,
    longitude: 92.15,
    area: "Camp central",
    openingHours: "08:00-20:00",
    contactNote: "Ask for the duty nurse.",
  },
  {
    name: "Tent Point A",
    category: "shelter_focal_point",
    latitude: 21.1952,
    longitude: 92.1523,
    area: "Block C",
    openingHours: "24 hours",
    contactNote: "Shelter focal point for Block C.",
  },
  {
    name: "Food Distribution Point",
    category: "food_distribution",
    latitude: 21.1888,
    longitude: 92.1452,
    area: "Block A",
    openingHours: "09:00-17:00",
    contactNote: "Hot meals twice daily.",
  },
  {
    name: "WASH Point",
    category: "wash_point",
    latitude: 21.1926,
    longitude: 92.1584,
    area: "Block B",
    openingHours: "06:00-22:00",
    contactNote: "Water and sanitation supplies.",
  },
  {
    name: "CFM Desk",
    category: "cfm_desk",
    latitude: 21.2015,
    longitude: 92.1461,
    area: "Camp entrance",
    openingHours: "10:00-16:00",
    contactNote: "Community feedback and complaints.",
  },
  {
    name: "Protection Desk",
    category: "protection_desk",
    latitude: 21.1968,
    longitude: 92.1622,
    area: "Block D",
    openingHours: "08:00-18:00",
    contactNote: "Confidential protection support.",
  },
]) {
  const [existing] = await dbClient.select({ id: servicePoints.id }).from(servicePoints).where(eq(servicePoints.name, point.name)).limit(1);
  if (existing) await dbClient.update(servicePoints).set(point).where(eq(servicePoints.id, existing.id));
  else await dbClient.insert(servicePoints).values(point);
}

type CaseSeed = {
  clientId: string;
  owner: "volunteer" | "lead";
  summary: string;
  description: string;
  category: "shelter" | "protection" | "food" | "wash" | "health" | "other";
  urgency: "low" | "medium" | "high" | "critical";
  status: "new" | "in_progress" | "referred" | "resolved";
  locationName: string;
  latitude: number;
  longitude: number;
  nextContact: string | null;
  source: "manual" | "voice";
  aiAssisted: boolean;
  aiSource: string | null;
};

const caseSeeds: CaseSeed[] = [
  {
    clientId: "seed-case-01",
    owner: "volunteer",
    summary: "Torn tarpaulin after storm",
    description: "Family of four reports a torn tarpaulin and leaking roof since last night's storm.",
    category: "shelter",
    urgency: "high",
    status: "new",
    locationName: "Block C, Tent Point A",
    latitude: 21.1952,
    longitude: 92.1523,
    nextContact: "2026-11-21T09:00:00Z",
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-02",
    owner: "volunteer",
    summary: "Child with high fever",
    description: "Three-year-old with fever for two days; caregiver requests urgent medical attention.",
    category: "health",
    urgency: "critical",
    status: "in_progress",
    locationName: "Block B, near WASH Point",
    latitude: 21.1926,
    longitude: 92.1584,
    nextContact: "2026-11-20T08:30:00Z",
    source: "voice",
    aiAssisted: true,
    aiSource: "voice-transcript",
  },
  {
    clientId: "seed-case-03",
    owner: "volunteer",
    summary: "Family of six missed ration cycle",
    description: "Household missed the last two distribution cycles after losing their ration card.",
    category: "food",
    urgency: "medium",
    status: "referred",
    locationName: "Food Distribution Point, Block A",
    latitude: 21.1888,
    longitude: 92.1452,
    nextContact: "2026-11-23T11:00:00Z",
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-04",
    owner: "volunteer",
    summary: "Blocked drainage near latrine",
    description: "Standing water around the shared latrine block; residents ask for drainage clearing.",
    category: "wash",
    urgency: "low",
    status: "resolved",
    locationName: "Block B sanitation lane",
    latitude: 21.193,
    longitude: 92.159,
    nextContact: null,
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-05",
    owner: "volunteer",
    summary: "Unaccompanied minor spotted",
    description: "Community member reports a child traveling alone near the camp entrance.",
    category: "protection",
    urgency: "high",
    status: "new",
    locationName: "CFM Desk, Camp entrance",
    latitude: 21.2015,
    longitude: 92.1461,
    nextContact: "2026-11-20T14:00:00Z",
    source: "manual",
    aiAssisted: true,
    aiSource: "case-intake-assistant",
  },
  {
    clientId: "seed-case-06",
    owner: "volunteer",
    summary: "Lost ID documents replacement",
    description: "Resident lost registration documents while moving tents and needs help with replacement.",
    category: "other",
    urgency: "medium",
    status: "in_progress",
    locationName: "Camp entrance, registration desk",
    latitude: 21.2005,
    longitude: 92.147,
    nextContact: "2026-11-25T10:00:00Z",
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-07",
    owner: "lead",
    summary: "Collapse risk in temporary shelter",
    description: "Shelter structure is leaning with cracked support poles; immediate safety risk to occupants.",
    category: "shelter",
    urgency: "critical",
    status: "new",
    locationName: "Block D, row 12",
    latitude: 21.1968,
    longitude: 92.1622,
    nextContact: "2026-11-20T07:00:00Z",
    source: "voice",
    aiAssisted: true,
    aiSource: "voice-transcript",
  },
  {
    clientId: "seed-case-08",
    owner: "lead",
    summary: "Elderly patient needs referral",
    description: "Elderly man with chronic pain requires a hospital referral beyond the Health Post.",
    category: "health",
    urgency: "medium",
    status: "referred",
    locationName: "Health Post, Camp central",
    latitude: 21.2,
    longitude: 92.15,
    nextContact: "2026-11-24T09:30:00Z",
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-09",
    owner: "lead",
    summary: "Duplicate ration card request",
    description: "Household received a second ration card by mistake and asked to return it.",
    category: "food",
    urgency: "low",
    status: "resolved",
    locationName: "Block A distribution line",
    latitude: 21.1888,
    longitude: 92.1452,
    nextContact: null,
    source: "manual",
    aiAssisted: false,
    aiSource: null,
  },
  {
    clientId: "seed-case-10",
    owner: "lead",
    summary: "Water pump pressure drop",
    description: "Residents report very low water pressure at the communal pump during morning hours.",
    category: "wash",
    urgency: "high",
    status: "in_progress",
    locationName: "WASH Point, Block B",
    latitude: 21.1926,
    longitude: 92.1584,
    nextContact: "2026-11-21T16:00:00Z",
    source: "manual",
    aiAssisted: true,
    aiSource: "field-report-draft",
  },
];

const ownerById = { volunteer: volunteer.id, lead: lead.id };
const caseIdByClientId = new Map<string, string>();
let casesInserted = 0;
let casesExisting = 0;

for (const seed of caseSeeds) {
  const createdBy = ownerById[seed.owner];
  const [existing] = await dbClient
    .select({ id: cases.id })
    .from(cases)
    .where(and(eq(cases.createdBy, createdBy), eq(cases.clientId, seed.clientId)))
    .limit(1);
  if (existing) {
    caseIdByClientId.set(seed.clientId, existing.id);
    casesExisting += 1;
    continue;
  }
  const [inserted] = await dbClient
    .insert(cases)
    .values({
      clientId: seed.clientId,
      createdBy,
      assignedTo: createdBy,
      summary: seed.summary,
      description: seed.description,
      category: seed.category,
      urgency: seed.urgency,
      status: seed.status,
      locationName: seed.locationName,
      latitude: seed.latitude,
      longitude: seed.longitude,
      nextContact: seed.nextContact,
      source: seed.source,
      aiAssisted: seed.aiAssisted,
      aiSource: seed.aiSource,
    })
    .returning({ id: cases.id });
  caseIdByClientId.set(seed.clientId, inserted.id);
  casesInserted += 1;
}

type NoteSeed = {
  caseClientId: string;
  author: "volunteer" | "lead";
  note: string;
};

const noteSeeds: NoteSeed[] = [
  { caseClientId: "seed-case-02", author: "volunteer", note: "Referred to Health Post; duty nurse alerted by phone." },
  { caseClientId: "seed-case-02", author: "lead", note: "Escalated to health coordinator for urgent review." },
  { caseClientId: "seed-case-03", author: "volunteer", note: "Ration card copy collected; pending distribution list update." },
  { caseClientId: "seed-case-04", author: "volunteer", note: "Site cleared with community volunteers; monitoring for recurrence." },
  { caseClientId: "seed-case-05", author: "lead", note: "Case registered with protection desk; do not share identifying details." },
  { caseClientId: "seed-case-07", author: "lead", note: "Structural assessment requested; families temporarily relocated." },
  { caseClientId: "seed-case-10", author: "lead", note: "WASH technician scheduled for pump inspection." },
];

let notesInserted = 0;
let notesExisting = 0;

for (const seed of noteSeeds) {
  const caseId = caseIdByClientId.get(seed.caseClientId);
  if (!caseId) throw new Error(`no seeded case found for clientId ${seed.caseClientId}`);
  const userId = ownerById[seed.author];
  const [existing] = await dbClient
    .select({ id: caseNotes.id })
    .from(caseNotes)
    .where(and(eq(caseNotes.caseId, caseId), eq(caseNotes.userId, userId), eq(caseNotes.note, seed.note)))
    .limit(1);
  if (existing) {
    notesExisting += 1;
    continue;
  }
  await dbClient.insert(caseNotes).values({ caseId, userId, note: seed.note });
  notesInserted += 1;
}

type SafetySeed = {
  clientId: string;
  owner: "volunteer" | "lead";
  incidentType: "threat" | "harassment" | "other";
  anonymizedDescription: string;
  originalDescription: string | null;
  storeOriginal: boolean;
  approximateLocation: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "new" | "acknowledged" | "resolved";
  occurredAt: Date;
};

const safetySeeds: SafetySeed[] = [
  {
    clientId: "seed-safety-01",
    owner: "volunteer",
    incidentType: "threat",
    anonymizedDescription: "An individual reported being threatened by an unknown person near a distribution point.",
    originalDescription: "A man threatened me near the food line and said he would come back tonight.",
    storeOriginal: true,
    approximateLocation: "Near Food Distribution Point, Block A",
    urgency: "high",
    status: "acknowledged",
    occurredAt: new Date("2026-11-17T18:30:00Z"),
  },
  {
    clientId: "seed-safety-02",
    owner: "volunteer",
    incidentType: "harassment",
    anonymizedDescription: "Report of repeated verbal harassment near a sanitation point after dark.",
    originalDescription: null,
    storeOriginal: false,
    approximateLocation: "Block B WASH point",
    urgency: "medium",
    status: "new",
    occurredAt: new Date("2026-11-18T20:15:00Z"),
  },
  {
    clientId: "seed-safety-03",
    owner: "lead",
    incidentType: "other",
    anonymizedDescription: "Minor dispute between neighbors over tent boundaries resolved by community leaders.",
    originalDescription: null,
    storeOriginal: false,
    approximateLocation: "Block D",
    urgency: "low",
    status: "resolved",
    occurredAt: new Date("2026-11-15T09:00:00Z"),
  },
];

let safetyInserted = 0;
let safetyExisting = 0;

for (const seed of safetySeeds) {
  const createdBy = ownerById[seed.owner];
  const [existing] = await dbClient
    .select({ id: safetyReports.id })
    .from(safetyReports)
    .where(and(eq(safetyReports.createdBy, createdBy), eq(safetyReports.clientId, seed.clientId)))
    .limit(1);
  if (existing) {
    safetyExisting += 1;
    continue;
  }
  await dbClient.insert(safetyReports).values({
    clientId: seed.clientId,
    createdBy,
    incidentType: seed.incidentType,
    anonymizedDescription: seed.anonymizedDescription,
    originalDescription: seed.originalDescription,
    storeOriginal: seed.storeOriginal,
    approximateLocation: seed.approximateLocation,
    urgency: seed.urgency,
    status: seed.status,
    occurredAt: seed.occurredAt,
  });
  safetyInserted += 1;
}

console.log(
  `seed done: cases ${casesInserted} inserted / ${casesExisting} existing, notes ${notesInserted} inserted / ${notesExisting} existing, safety reports ${safetyInserted} inserted / ${safetyExisting} existing`,
);
await closeDb();
