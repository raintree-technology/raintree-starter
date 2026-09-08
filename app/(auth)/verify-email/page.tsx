import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/app/loading-skeletons";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Verify your email",
  description: "Confirm your email address to finish setting up your account.",
  path: "/verify-email",
});

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({ searchParams }: VerifyEmailPageProps) {
  const sp = await searchParams;
  return <VerifyEmailCard email={sp.email} />;
}
