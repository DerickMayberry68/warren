import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let db: Db | null = null;
let client: postgres.Sql | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL.");
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, { prepare: false });
  }

  if (!db) {
    db = drizzle(client, { schema });
  }

  return db;
}
