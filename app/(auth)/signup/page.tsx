import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/app/loading-skeletons";
import { SignupForm } from "@/components/auth/signup-form";
import { enabledOAuthProviders } from "@/lib/auth-providers";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getSession } from "@/lib/session";

export const metadata = createNoIndexMetadata({
  title: "Create account",
  description: "Create an account to start using Next Starter.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignupContent />
    </Suspense>
  );
}

async function SignupContent() {
  // Already signed in — continue to the app instead of showing the form.
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <SignupForm providers={enabledOAuthProviders()} />;
}
