import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, dbClient } from "./client";

await migrate(dbClient, { migrationsFolder: "./drizzle" });
console.log("migrations applied");
await closeDb();
