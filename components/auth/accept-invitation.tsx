"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AuthLoadingButton,
  toastAuthError,
  useAuthAction,
} from "@/components/auth/form-parts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const INVITATION_ERROR = "This invitation is invalid or expired";

export function AcceptInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const acceptInvitation = useAuthAction();

  async function accept() {
    await acceptInvitation.run(async () => {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (error) {
        toastAuthError(error, INVITATION_ERROR);
        return;
      }
      toast.success("You've joined the organization");
      router.push("/dashboard");
      router.refresh();
    }, INVITATION_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;re invited</CardTitle>
        <CardDescription>
          Accept this invitation to join the organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthLoadingButton
          loading={acceptInvitation.loading}
          loadingText="Joining…"
          onClick={accept}
        >
          Accept invitation
        </AuthLoadingButton>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </Link>
      </CardFooter>
    </Card>
  );
}
