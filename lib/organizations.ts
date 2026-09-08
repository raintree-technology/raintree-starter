import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { createOperationLogger } from "@/lib/logger";

/** Organizations the user belongs to, with their role in each. */
export const getOrganizationsForUser = cache(
  async function getOrganizationsForUser(userId: string) {
    const operation = createOperationLogger({
      module: "organizations",
      userId,
    });

    try {
      const organizations = await db
        .select({
          id: schema.organization.id,
          name: schema.organization.name,
          slug: schema.organization.slug,
          logo: schema.organization.logo,
          role: schema.member.role,
        })
        .from(schema.member)
        .innerJoin(
          schema.organization,
          eq(schema.member.organizationId, schema.organization.id),
        )
        .where(eq(schema.member.userId, userId))
        .orderBy(desc(schema.member.createdAt));
      operation.debug(
        { count: organizations.length },
        "organizations.for_user.completed",
      );
      return organizations;
    } catch (err) {
      operation.error({ err }, "organizations.for_user.failed");
      throw err;
    }
  },
);

export const getOrganization = cache(async function getOrganization(
  organizationId: string,
) {
  const operation = createOperationLogger({
    module: "organizations",
    organizationId,
  });

  try {
    const rows = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, organizationId));
    const organization = rows[0] ?? null;
    operation.debug(
      { found: organization !== null },
      "organization.get.completed",
    );
    return organization;
  } catch (err) {
    operation.error({ err }, "organization.get.failed");
    throw err;
  }
});

/** Members of an organization joined with their user profile. */
export const getOrganizationMembers = cache(
  async function getOrganizationMembers(organizationId: string) {
    const operation = createOperationLogger({
      module: "organizations",
      organizationId,
    });

    try {
      const members = await db
        .select({
          id: schema.member.id,
          role: schema.member.role,
          userId: schema.member.userId,
          name: schema.user.name,
          email: schema.user.email,
          image: schema.user.image,
          joinedAt: schema.member.createdAt,
        })
        .from(schema.member)
        .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
        .where(eq(schema.member.organizationId, organizationId))
        .orderBy(desc(schema.member.createdAt));
      operation.debug(
        { count: members.length },
        "organization.members.completed",
      );
      return members;
    } catch (err) {
      operation.error({ err }, "organization.members.failed");
      throw err;
    }
  },
);

export const getMembership = cache(async function getMembership(
  organizationId: string,
  userId: string,
) {
  const operation = createOperationLogger({
    module: "organizations",
    organizationId,
    userId,
  });

  try {
    const rows = await db
      .select()
      .from(schema.member)
      .where(
        and(
          eq(schema.member.organizationId, organizationId),
          eq(schema.member.userId, userId),
        ),
      );
    const membership = rows[0] ?? null;
    operation.debug(
      { found: membership !== null },
      "organization.membership.completed",
    );
    return membership;
  } catch (err) {
    operation.error({ err }, "organization.membership.failed");
    throw err;
  }
});

export const getPendingInvitations = cache(async function getPendingInvitations(
  organizationId: string,
) {
  const operation = createOperationLogger({
    module: "organizations",
    organizationId,
  });

  try {
    const invitations = await db
      .select()
      .from(schema.invitation)
      .where(
        and(
          eq(schema.invitation.organizationId, organizationId),
          eq(schema.invitation.status, "pending"),
        ),
      )
      .orderBy(desc(schema.invitation.createdAt));
    operation.debug(
      { count: invitations.length },
      "organization.invitations.pending.completed",
    );
    return invitations;
  } catch (err) {
    operation.error({ err }, "organization.invitations.pending.failed");
    throw err;
  }
});
