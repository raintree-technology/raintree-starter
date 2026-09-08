"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/settings/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { authClient } from "@/lib/auth-client";
import { formatDate, getErrorMessage } from "@/lib/utils";

type SessionRow = {
  id: string;
  token: string;
  userAgent: string | null;
  createdAt: Date;
};

function describe(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/mobile/i.test(userAgent)) return "Mobile device";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Browser";
}

export function Sessions({
  sessions,
  currentToken,
}: {
  sessions: SessionRow[];
  currentToken: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function revoke(token: string): Promise<boolean> {
    setBusy(token);
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        toast.error(error.message ?? "Could not revoke");
        return false;
      }
      toast.success("Session revoked");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not revoke"));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function revokeOthers(): Promise<boolean> {
    setBusy("others");
    try {
      const result = await authClient.revokeOtherSessions();
      if (result?.error) {
        toast.error(result.error.message ?? "Could not revoke other sessions");
        return false;
      }
      toast.success("Signed out of other sessions");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not revoke other sessions"));
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Devices currently signed in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 && (
          <EmptyState
            size="inline"
            title="No other sessions"
            description="Only this device is signed in to your account."
          />
        )}
        {sessions.map((s) => {
          const isCurrent = s.token === currentToken;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {describe(s.userAgent)}
                  {isCurrent && (
                    <Badge variant="secondary" className="ml-2">
                      This device
                    </Badge>
                  )}
                </p>
                <p className="text-footnote">
                  Signed in {formatDate(s.createdAt)}
                </p>
              </div>
              {!isCurrent && (
                <ConfirmAction
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                    >
                      Revoke
                    </Button>
                  }
                  title="Revoke this session?"
                  description="This device will be signed out and will need to authenticate again."
                  confirmLabel="Revoke session"
                  onConfirm={() => revoke(s.token)}
                  disabled={busy !== null}
                />
              )}
            </div>
          );
        })}
        {sessions.length > 1 && (
          <ConfirmAction
            trigger={
              <Button variant="ghost" size="sm" disabled={busy !== null}>
                Sign out of all other sessions
              </Button>
            }
            title="Sign out of all other sessions?"
            description="Every other device will be signed out. This device will stay signed in."
            confirmLabel="Sign out other sessions"
            onConfirm={revokeOthers}
            disabled={busy !== null}
          />
        )}
      </CardContent>
    </Card>
  );
}
