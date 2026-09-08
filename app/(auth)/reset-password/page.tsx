import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/app/loading-skeletons";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Reset password",
  description: "Choose a new password for your account.",
  path: "/reset-password",
});

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const sp = await searchParams;
  return <ResetPasswordForm token={sp.token} />;
}
