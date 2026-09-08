import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/app/page-header";
import { listAllUsers } from "@/lib/data/admin";
import { createNoIndexMetadata } from "@/lib/metadata";
import { requireAdmin } from "@/lib/session";

export const metadata = createNoIndexMetadata({
  title: "Admin",
  description: "Manage users across the platform.",
  path: "/admin",
});

export default async function AdminPage() {
  const session = await requireAdmin();
  const users = await listAllUsers();

  return (
    <div className="content-width py-8">
      <PageHeader
        title="Admin"
        description="Manage users across the platform."
      />
      <UsersTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          banned: u.banned,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
