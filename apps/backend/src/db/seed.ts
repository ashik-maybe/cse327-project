import { dbClient } from "./client";
import { users, cases, caseNotes, safetyReports, servicePoints } from "./schema";

await dbClient.insert(users).values([
  { name: "Demo Volunteer", email: "volunteer@campbridge.local", passwordHash: "demohash123", role: "volunteer" },
  { name: "Demo Lead", email: "lead@campbridge.local", passwordHash: "demohash456", role: "team_lead" },
]);

await dbClient.insert(servicePoints).values([
  { name: "Tent Point A", category: "shelter", latitude: 21.1952, longitude: 92.1523, area: "Block C" },
  { name: "Health Post", category: "health", latitude: 21.2, longitude: 92.15 },
]);

console.log("seed done");
