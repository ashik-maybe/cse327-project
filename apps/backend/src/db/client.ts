import { drizzle } from "drizzle-orm/postgres";
import { Client } from "postgres";
import * as schema from "./schema";

const client = new Client({ connectionString: process.env.DATABASE_URL || "postgres://campbridge:campbridge@localhost:5432/campbridge" });
await client.connect();
export const dbClient = drizzle(client, { schema });
