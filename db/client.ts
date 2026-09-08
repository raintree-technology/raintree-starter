import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

function databaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  return connectionString;
}

function isLocalDatabaseUrl(connectionString: string) {
  try {
    const { hostname } = new URL(connectionString);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

function isNeonDatabaseUrl(connectionString: string) {
  try {
    const { hostname } = new URL(connectionString);
    return (
      !isLocalDatabaseUrl(connectionString) && hostname.endsWith(".neon.tech")
    );
  } catch {
    return false;
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __nextStarterPgPool?: PgPool;
  __nextStarterPgPoolUrl?: string;
};

function getPgPool(connectionString: string) {
  if (process.env.NODE_ENV === "production") {
    return new PgPool({ connectionString });
  }

  if (
    !globalForDb.__nextStarterPgPool ||
    globalForDb.__nextStarterPgPoolUrl !== connectionString
  ) {
    globalForDb.__nextStarterPgPool = new PgPool({ connectionString });
    globalForDb.__nextStarterPgPoolUrl = connectionString;
  }

  return globalForDb.__nextStarterPgPool;
}

function createDbState(connectionString: string) {
  if (isNeonDatabaseUrl(connectionString)) {
    const neonPool = new NeonPool({ connectionString });
    return {
      connectionString,
      neonPool,
      pgPool: undefined,
      db: drizzleNeon({ client: neonPool, schema }),
    };
  }

  const pgPool = getPgPool(connectionString);
  return {
    connectionString,
    neonPool: undefined,
    pgPool,
    db: drizzleNode({ client: pgPool, schema }),
  };
}

type DbState = ReturnType<typeof createDbState>;

let dbState: DbState | undefined;

function getDbState(): DbState {
  const connectionString = databaseUrl();
  if (!dbState || dbState.connectionString !== connectionString) {
    dbState = createDbState(connectionString);
  }

  return dbState;
}

type DB = DbState["db"];

function getDb(): DB {
  return getDbState().db;
}

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const target = getDb();
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
  has(_target, prop) {
    return prop in getDb();
  },
  ownKeys() {
    return Reflect.ownKeys(getDb());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getDb(), prop);
    if (descriptor) descriptor.configurable = true;
    return descriptor;
  },
}) as DB;

export async function closeDb() {
  if (!dbState) return;

  const current = dbState;
  dbState = undefined;

  if (current.neonPool) {
    await current.neonPool.end();
    return;
  }

  if (!current.pgPool) return;

  await current.pgPool.end();

  if (globalForDb.__nextStarterPgPool === current.pgPool) {
    globalForDb.__nextStarterPgPool = undefined;
    globalForDb.__nextStarterPgPoolUrl = undefined;
  }
}
