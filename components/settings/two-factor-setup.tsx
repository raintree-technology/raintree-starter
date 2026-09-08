"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

/** The shared secret inside an otpauth:// URI, for manual entry when scanning fails. */
function totpSecretFromUri(totpUri: string): string | null {
  try {
    return new URL(totpUri).searchParams.get("secret");
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied to clipboard`);
  } catch {
    toast.error(
      `Could not copy — select the ${what.toLowerCase()} and copy it manually`,
    );
  }
}

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"password" | "verify">("password");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const manualSecret = totpUri ? totpSecretFromUri(totpUri) : null;

  function reset() {
    setPassword("");
    setStep("password");
    setTotpUri("");
    setBackupCodes([]);
    setCode("");
  }

  async function startEnable() {
    setLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error || !data) {
        toast.error(error?.message ?? "Incorrect password");
        return;
      }
      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes ?? []);
      setStep("verify");
    } catch (error) {
      toast.error(getErrorMessage(error, "Incorrect password"));
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        toast.error(error.message ?? "Invalid code");
        return;
      }
      toast.success("Two-factor authentication enabled");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid code"));
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        toast.error(error.message ?? "Incorrect password");
        return;
      }
      toast.success("Two-factor authentication disabled");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Incorrect password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Two-factor authentication</CardTitle>
          {enabled && <StatusBadge tone="positive">Enabled</StatusBadge>}
        </div>
        <CardDescription>
          Add a time-based one-time code from an authenticator app as a second
          factor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant={enabled ? "outline" : "default"}>
              {enabled ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          </DialogTrigger>

          <DialogContent>
            {!enabled && step === "verify" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Scan the QR code</DialogTitle>
                  <DialogDescription>
                    Scan with your authenticator app, then enter the 6-digit
                    code to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                  <div className="rounded-lg border bg-white p-4">
                    <QRCode
                      aria-label="Authenticator setup QR code"
                      value={totpUri}
                      size={160}
                    />
                  </div>
                </div>
                {manualSecret && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        Can&apos;t scan? Enter this key manually:
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {manualSecret}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void copyToClipboard(manualSecret, "Setup key")
                      }
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                )}
                {backupCodes.length > 0 && (
                  <div className="rounded-lg border bg-secondary/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">
                        Backup codes — save these now. They are shown only once:
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void copyToClipboard(
                            backupCodes.join("\n"),
                            "Backup codes",
                          )
                        }
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                      {backupCodes.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void confirmEnable();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="totp">Verification code</Label>
                    <Input
                      id="totp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={loading || code.length !== 6}
                    >
                      {loading ? "Verifying…" : "Confirm"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {enabled ? "Disable two-factor" : "Enable two-factor"}
                  </DialogTitle>
                  <DialogDescription>
                    {enabled
                      ? "Confirm your password to disable two-factor authentication."
                      : "Confirm your password to continue."}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (enabled ? disable() : startEnable());
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="tf-password">Password</Label>
                    <Input
                      id="tf-password"
                      type="password"
                      autoComplete="current-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={loading || !password}
                      variant={enabled ? "destructive" : "default"}
                    >
                      {loading ? "Working…" : enabled ? "Disable" : "Continue"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
