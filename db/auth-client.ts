import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForAuthDb = globalThis as typeof globalThis & {
  __nextStarterAuthPool?: Pool;
  __nextStarterAuthPoolUrl?: string;
};
let productionAuthPool: Pool | undefined;
let productionAuthPoolUrl: string | undefined;

function authDatabaseUrl(): string {
  const connectionString =
    process.env.AUTH_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("AUTH_DATABASE_URL or DATABASE_URL is required.");
  return connectionString;
}

function getAuthPool(): Pool {
  const connectionString = authDatabaseUrl();
  if (process.env.NODE_ENV === "production") {
    if (!productionAuthPool || productionAuthPoolUrl !== connectionString) {
      productionAuthPool = new Pool({ connectionString });
      productionAuthPoolUrl = connectionString;
    }
    return productionAuthPool;
  }

  if (
    !globalForAuthDb.__nextStarterAuthPool ||
    globalForAuthDb.__nextStarterAuthPoolUrl !== connectionString
  ) {
    const pool = new Pool({ connectionString });
    globalForAuthDb.__nextStarterAuthPool = pool;
    globalForAuthDb.__nextStarterAuthPoolUrl = connectionString;
    return pool;
  }
  return globalForAuthDb.__nextStarterAuthPool;
}

type AuthDb = ReturnType<typeof drizzle<typeof schema>>;

export const authDb = new Proxy({} as AuthDb, {
  get(_target, prop, receiver) {
    const target = drizzle({ client: getAuthPool(), schema });
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as AuthDb;
