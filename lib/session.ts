import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * Server-side session helpers.
 *
 * `getSession` is wrapped in React's `cache` so multiple calls within a single
 * request (layout + page + actions) share one lookup.
 */
export const getSession = cache(async () => {
  const requestHeaders = await headers();

  return auth.api.getSession({ headers: requestHeaders });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!("role" in session.user) || session.user.role !== "admin")
    redirect("/dashboard");
  return session;
}

export type CurrentSession = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>;

/**
 * Active organization id on the session. Better Auth's organization plugin sets
 * this at runtime but does not surface it on the inferred session type, so we
 * read it through a narrow cast. Returns null in single-tenant mode.
 */
export function getActiveOrganizationId(
  session: CurrentSession,
): string | null {
  return (
    (session.session as { activeOrganizationId?: string | null })
      .activeOrganizationId ?? null
  );
}

/**
 * Id of the admin impersonating this session, if any. Better Auth's admin
 * plugin sets this at runtime but does not surface it on the inferred type.
 */
export function getImpersonatedBy(session: CurrentSession): string | null {
  return (
    (session.session as { impersonatedBy?: string | null }).impersonatedBy ??
    null
  );
}
