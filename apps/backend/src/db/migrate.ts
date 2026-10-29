import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dbClient } from "./client";

await migrate(dbClient, { migrationsFolder: "./drizzle" });
console.log("migrations applied");
