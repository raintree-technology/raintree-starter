import { redirect } from "next/navigation";
import { Onboarding, OnboardingIdentity } from "@/components/app/onboarding";
import { Logo } from "@/components/logo";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getOrganizationsForUser } from "@/lib/organizations";
import { getImpersonatedBy, getSession } from "@/lib/session";
import { isMultiTenant } from "@/lib/tenancy";

export const metadata = createNoIndexMetadata({
  title: "Onboarding",
  description: "Create or select an organization before using the app.",
  path: "/onboarding",
});

export default async function OnboardingPage() {
  if (!isMultiTenant) redirect("/dashboard");

  const session = await getSession();
  if (!session) redirect("/login");

  const orgs = await getOrganizationsForUser(session.user.id);

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md">
        <h1 className="sr-only">Set up your organization</h1>
        <Onboarding
          organizations={orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
          }))}
        />
        <OnboardingIdentity
          email={session.user.email}
          impersonating={Boolean(getImpersonatedBy(session))}
        />
      </div>
    </main>
  );
}
