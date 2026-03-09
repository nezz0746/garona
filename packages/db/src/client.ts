import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://garona:garona@localhost:5433/garona";

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 5,
  connect_timeout: 10,
  connection: {
    application_name: "garona-api",
  },
});
export const db = drizzle(client, { schema });
export type Database = typeof db;
