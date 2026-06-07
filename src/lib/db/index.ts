import { repositories as inMemoryRepositories } from "@/lib/db/in-memory";
import { postgresRepositories } from "@/lib/db/postgres";

export const repositories = process.env.DATABASE_URL ? postgresRepositories : inMemoryRepositories;
