import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://campbridge:campbridge@localhost:5432/campbridge";
const client = postgres(databaseUrl);
export const dbClient = drizzle(client, { schema });
