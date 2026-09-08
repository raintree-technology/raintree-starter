/**
 * Seed an admin user. Run with: bun run db:seed
 * Requires DATABASE_URL to point at a migrated database.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { closeDb, db } from "./client";

const seedConfigSchema = z.object({
  email: z.email(),
  name: z.string().min(1).default("Admin"),
  password: z.string().min(8),
});

type SeedConfig = z.infer<typeof seedConfigSchema>;
type SeedTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to run db:seed.`);
  }
  return value;
}

function getSeedConfig() {
  const result = seedConfigSchema.safeParse({
    email: getRequiredEnv("SEED_ADMIN_EMAIL").toLowerCase(),
    name: process.env.SEED_ADMIN_NAME?.trim() || undefined,
    password: getRequiredEnv("SEED_ADMIN_PASSWORD"),
  });

  if (!result.success) {
    throw new Error(
      `Invalid db:seed configuration:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

function assertSeedAllowed() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_SEED !== "1"
  ) {
    throw new Error(
      "Refusing to seed while NODE_ENV=production. Set ALLOW_PRODUCTION_SEED=1 to override.",
    );
  }
}

async function upsertAdminUser(tx: SeedTransaction, config: SeedConfig) {
  const [existingUser] = await tx
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, config.email))
    .limit(1);

  if (!existingUser) {
    const now = new Date();
    const [createdUser] = await tx
      .insert(schema.user)
      .values({
        id: randomUUID(),
        name: config.name,
        email: config.email,
        emailVerified: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.user.id });

    if (!createdUser) {
      throw new Error(`Failed to create seed admin ${config.email}.`);
    }

    return { created: true, userId: createdUser.id };
  }

  const [updatedUser] = await tx
    .update(schema.user)
    .set({
      name: config.name,
      emailVerified: true,
      role: "admin",
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, existingUser.id))
    .returning({ id: schema.user.id });

  if (!updatedUser) {
    throw new Error(`Failed to update seed admin ${config.email}.`);
  }

  return { created: false, userId: updatedUser.id };
}

async function upsertCredentialAccount(
  tx: SeedTransaction,
  userId: string,
  password: string,
) {
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const [existingAccount] = await tx
    .select({ id: schema.account.id })
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential"),
      ),
    )
    .limit(1);

  if (!existingAccount) {
    await tx.insert(schema.account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  const [updatedAccount] = await tx
    .update(schema.account)
    .set({
      accountId: userId,
      password: passwordHash,
      updatedAt: now,
    })
    .where(eq(schema.account.id, existingAccount.id))
    .returning({ id: schema.account.id });

  if (!updatedAccount) {
    throw new Error(
      `Failed to update credential account for seed admin ${userId}.`,
    );
  }
}

async function main() {
  assertSeedAllowed();
  const config = getSeedConfig();

  const result = await db.transaction(async (tx) => {
    const adminUser = await upsertAdminUser(tx, config);
    await upsertCredentialAccount(tx, adminUser.userId, config.password);
    return adminUser;
  });

  console.log(
    [
      "",
      result.created
        ? "Created seed admin account:"
        : "Updated seed admin account:",
      `  email: ${config.email}`,
      "  password: set from SEED_ADMIN_PASSWORD",
      "",
    ].join("\n"),
  );
}

function reportSeedError(err: unknown) {
  if (!(err instanceof Error)) {
    console.error(err);
    return;
  }

  console.error(err.message);
  if (process.env.SEED_DEBUG === "1" && err.stack) {
    console.error(err.stack);
  }
}

main()
  .catch((err) => {
    reportSeedError(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
