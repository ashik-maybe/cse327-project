import { closeDb, dbClient } from "./client";
import { servicePoints, users } from "./schema";
import { eq } from "drizzle-orm";
import { hash } from "../services/auth.service";

await dbClient.insert(users).values([
  { name: "Demo Volunteer", email: "volunteer@campbridge.local", passwordHash: hash("demo1234"), role: "volunteer" },
  { name: "Demo Lead", email: "lead@campbridge.local", passwordHash: hash("lead1234"), role: "team_lead" },
]).onConflictDoNothing({ target: users.email });

for (const point of [
  { name: "Tent Point A", category: "shelter", latitude: 21.1952, longitude: 92.1523, area: "Block C" },
  { name: "Health Post", category: "health", latitude: 21.2, longitude: 92.15 },
]) {
  const [existing] = await dbClient.select({ id: servicePoints.id }).from(servicePoints).where(eq(servicePoints.name, point.name)).limit(1);
  if (!existing) await dbClient.insert(servicePoints).values(point);
}

console.log("seed done");
await closeDb();
