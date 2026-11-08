import { closeDb, dbClient } from "./client";
import { servicePoints, users } from "./schema";
import { eq } from "drizzle-orm";
import { hash } from "../services/auth.service";

await dbClient.insert(users).values([
  { name: "Demo Volunteer", email: "volunteer@campbridge.local", passwordHash: hash("demo1234"), role: "volunteer" },
  { name: "Demo Lead", email: "lead@campbridge.local", passwordHash: hash("lead1234"), role: "team_lead" },
]).onConflictDoNothing({ target: users.email });

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

console.log("seed done");
await closeDb();
