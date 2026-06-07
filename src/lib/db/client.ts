import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }

  return sqlClient;
}
