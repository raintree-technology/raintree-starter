import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/app/loading-skeletons";
import { LoginForm } from "@/components/auth/login-form";
import { enabledOAuthProviders } from "@/lib/auth-providers";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";

export const metadata = createNoIndexMetadata({
  title: "Sign in",
  description: "Sign in to your Next Starter account.",
  path: "/login",
});

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const resolved = getSafeInternalRedirect(sp.redirect);
  // Never bounce back into the auth pages themselves (avoids a redirect loop).
  const target =
    resolved.startsWith("/login") || resolved.startsWith("/signup")
      ? ("/dashboard" as const)
      : resolved;

  // Already signed in — continue to the app instead of showing the form.
  const session = await getSession();
  if (session) redirect(target);

  return <LoginForm redirect={target} providers={enabledOAuthProviders()} />;
}
