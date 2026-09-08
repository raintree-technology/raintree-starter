import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { AppShellSkeleton } from "@/components/app/loading-skeletons";
import { RecoverableErrorBoundary } from "@/components/error-boundary";
import { getAppContext } from "@/lib/app-context";
import { getImpersonatedBy } from "@/lib/session";
import { isMultiTenant } from "@/lib/tenancy";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </Suspense>
  );
}

async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");

  // Multi-tenant: an active organization is required to use the app.
  if (isMultiTenant && !ctx.activeOrganizationId) redirect("/onboarding");

  return (
    <AppShell
      user={{
        name: ctx.user.name,
        email: ctx.user.email,
        image: ctx.user.image,
      }}
      organizations={ctx.organizations}
      activeOrganization={ctx.activeOrganization}
      multiTenant={isMultiTenant}
      isAdmin={ctx.isAdmin}
      planLabel={ctx.plan?.label ?? "Free"}
      impersonating={Boolean(getImpersonatedBy(ctx.session))}
    >
      <RecoverableErrorBoundary
        title="This page could not load."
        description="Try again while keeping your navigation and account controls in place."
        homeHref="/dashboard"
        homeLabel="Open dashboard"
        className="m-4 min-h-[calc(100dvh-6.5rem)] sm:m-6"
      >
        {children}
      </RecoverableErrorBoundary>
    </AppShell>
  );
}
