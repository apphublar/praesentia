import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      max: 3,           // serverless: keep connections low to avoid pool exhaustion
      idle_timeout: 30,
      connect_timeout: 30,
      prepare: false
    });
  }

  return sqlClient;
}
