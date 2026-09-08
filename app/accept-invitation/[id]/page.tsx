import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/app/loading-skeletons";
import { AcceptInvitation } from "@/components/auth/accept-invitation";
import { Logo } from "@/components/logo";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getSession } from "@/lib/session";

type AcceptInvitationPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = createNoIndexMetadata({
  title: "Accept invitation",
  description: "Accept an organization invitation after signing in.",
  path: "/accept-invitation",
});

export default function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  return (
    <Suspense fallback={<AcceptInvitationSkeleton />}>
      <AcceptInvitationContent params={params} />
    </Suspense>
  );
}

async function AcceptInvitationContent({ params }: AcceptInvitationPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?redirect=/accept-invitation/${id}`);

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="sr-only">Accept invitation</h1>
        <AcceptInvitation invitationId={id} />
      </div>
    </main>
  );
}

function AcceptInvitationSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <AuthFormSkeleton />
      </div>
    </div>
  );
}
