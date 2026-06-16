import { repositories as inMemoryRepositories } from "@/lib/db/in-memory";
import { inMemoryAdmin } from "@/lib/db/admin-in-memory";
import { postgresAdmin } from "@/lib/db/admin-postgres";
import { postgresRepositories } from "@/lib/db/postgres";

export const repositories = process.env.DATABASE_URL ? postgresRepositories : inMemoryRepositories;
export const adminRepository = process.env.DATABASE_URL ? postgresAdmin : inMemoryAdmin;
