"use client";

import { type FormEvent, useState } from "react";
import {
  AuthField,
  AuthLoadingButton,
  getFormString,
  toastAuthError,
  useAuthAction,
} from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const TWO_FACTOR_ERROR = "Invalid code";

export function TwoFactorForm() {
  const [useBackup, setUseBackup] = useState(false);
  const verifyCode = useAuthAction();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = getFormString(formData, "code");

    await verifyCode.run(async () => {
      const { error } = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        toastAuthError(error, TWO_FACTOR_ERROR);
        return;
      }
      // Full navigation: avoid stale pre-auth payloads in the router cache.
      window.location.assign("/dashboard");
    }, TWO_FACTOR_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Two-factor authentication</CardTitle>
        <CardDescription>
          {useBackup
            ? "Enter one of your backup codes."
            : "Enter the 6-digit code from your authenticator app."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            key={useBackup ? "backup" : "totp"}
            id="code"
            label={useBackup ? "Backup code" : "Code"}
            inputMode={useBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            maxLength={useBackup ? undefined : 6}
            pattern={useBackup ? undefined : "[0-9]{6}"}
            required
            autoFocus
          />
          <AuthLoadingButton
            type="submit"
            loading={verifyCode.loading}
            loadingText="Verifying…"
          >
            Verify
          </AuthLoadingButton>
        </form>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setUseBackup((v) => !v)}
        >
          {useBackup ? "Use authenticator app" : "Use a backup code"}
        </Button>
      </CardContent>
    </Card>
  );
}
