import { redirect } from "next/navigation";
import { TeamManagement } from "@/components/settings/team-management";
import { getAppContext } from "@/lib/app-context";
import { createNoIndexMetadata } from "@/lib/metadata";
import {
  getMembership,
  getOrganizationMembers,
  getPendingInvitations,
} from "@/lib/organizations";
import { isMultiTenant } from "@/lib/tenancy";

export const metadata = createNoIndexMetadata({
  title: "Members",
  description: "Manage organization members and invitations.",
  path: "/settings/members",
});

export default async function MembersSettingsPage() {
  if (!isMultiTenant) redirect("/settings");

  const ctx = await getAppContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrganizationId) redirect("/onboarding");

  const [members, invitations, membership] = await Promise.all([
    getOrganizationMembers(ctx.activeOrganizationId),
    getPendingInvitations(ctx.activeOrganizationId),
    getMembership(ctx.activeOrganizationId, ctx.user.id),
  ]);

  const canManage =
    membership?.role === "owner" || membership?.role === "admin";

  return (
    <TeamManagement
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        image: m.image,
        role: m.role,
      }))}
      invitations={invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role ?? "member",
      }))}
      currentUserId={ctx.user.id}
      canManage={canManage}
    />
  );
}
