"use client";

import { Fingerprint, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/settings/confirm-action";
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

type Passkey = {
  id: string;
  name: string | null;
  deviceType: string | null;
  createdAt: Date | null;
};

export function Passkeys({ passkeys }: { passkeys: Passkey[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function add() {
    setLoading(true);
    try {
      const res = await authClient.passkey.addPasskey();
      if (res?.error) {
        toast.error(res.error.message ?? "Could not add passkey");
        return;
      }
      toast.success("Passkey added");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add passkey"));
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string): Promise<boolean> {
    setRemoving(id);
    try {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        toast.error(error.message ?? "Could not remove passkey");
        return false;
      }
      toast.success("Passkey removed");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove passkey"));
      return false;
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Sign in with Face ID, Touch ID, or a security key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {passkeys.length === 0 ? (
          <EmptyState
            size="inline"
            icon={Fingerprint}
            title="No passkeys yet"
            description="Add one to sign in without a password on this device."
          />
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {pk.name || pk.deviceType || "Passkey"}
                  </p>
                  {pk.createdAt && (
                    <p className="text-footnote">
                      Added {formatDate(pk.createdAt)}
                    </p>
                  )}
                </div>
              </div>
              <ConfirmAction
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={removing !== null}
                    aria-label={`Remove passkey ${pk.name || pk.deviceType || ""}`.trim()}
                    title="Remove passkey"
                  >
                    {removing === pk.id ? (
                      <LoaderCircle className="animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="text-muted-foreground" />
                    )}
                  </Button>
                }
                title="Remove this passkey?"
                description="This passkey will no longer be able to sign in to your account."
                confirmLabel="Remove passkey"
                onConfirm={() => remove(pk.id)}
                disabled={removing !== null}
              />
            </div>
          ))
        )}
        <Button
          variant="outline"
          onClick={add}
          disabled={loading || removing !== null}
        >
          {loading ? "Waiting for device…" : "Add passkey"}
        </Button>
      </CardContent>
    </Card>
  );
}
