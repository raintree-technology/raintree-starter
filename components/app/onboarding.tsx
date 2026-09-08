"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage, slugify } from "@/lib/utils";

type Org = { id: string; name: string; slug: string };

/**
 * After creating/selecting the org we do a full navigation instead of a client
 * transition: the router cache may still hold a /dashboard payload rendered
 * before the active organization existed, which would bounce back here.
 */
function enterDashboard() {
  window.location.assign("/dashboard");
}

export function Onboarding({ organizations }: { organizations: Org[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOrganizationId, setPendingOrganizationId] = useState<
    string | null
  >(null);
  const busy = loading || pendingOrganizationId !== null;

  async function createOrg(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Organization name is too short");
      return;
    }
    setLoading(true);
    try {
      const slug = `${slugify(trimmedName)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await authClient.organization.create({
        name: trimmedName,
        slug,
      });
      if (error || !data) {
        toast.error(error?.message ?? "Could not create organization");
        setLoading(false);
        return;
      }
      const active = await authClient.organization.setActive({
        organizationId: data.id,
      });
      if (active.error) {
        toast.error(active.error.message ?? "Could not select organization");
        setLoading(false);
        return;
      }
      enterDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create organization"));
      setLoading(false);
    }
  }

  async function selectOrg(id: string) {
    if (busy) return;

    setPendingOrganizationId(id);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: id,
      });
      if (error) {
        toast.error(error.message ?? "Could not select organization");
        setPendingOrganizationId(null);
        return;
      }
      enterDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not select organization"));
      setPendingOrganizationId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {organizations.length
            ? "Choose an organization"
            : "Create your organization"}
        </CardTitle>
        <CardDescription>
          {organizations.length
            ? "Pick an organization to continue, or create a new one."
            : "Organizations group your members, projects, and billing."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {organizations.length > 0 && (
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                type="button"
                key={org.id}
                onClick={() => void selectOrg(org.id)}
                disabled={busy}
                aria-label={`Open ${org.name}`}
                className="flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-60"
              >
                <span className="min-w-0 truncate font-medium">{org.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                  {pendingOrganizationId === org.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Opening…
                    </>
                  ) : (
                    <>
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </span>
              </button>
            ))}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  or create new
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={createOrg} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              disabled={busy}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {loading ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Shows who is signed in on the onboarding screen, with an escape hatch. */
export function OnboardingIdentity({
  email,
  impersonating = false,
}: {
  email: string;
  impersonating?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message ?? "Could not sign out");
        setPending(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not sign out"));
      setPending(false);
    }
  }

  async function stopImpersonating() {
    if (pending) return;
    setPending(true);
    try {
      const { error } = await authClient.admin.stopImpersonating();
      if (error) {
        toast.error(error.message ?? "Could not stop impersonating");
        setPending(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not stop impersonating"));
      setPending(false);
    }
  }

  if (impersonating) {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        You are impersonating{" "}
        <span className="font-medium text-foreground">{email}</span>.{" "}
        <button
          type="button"
          onClick={() => void stopImpersonating()}
          disabled={pending}
          className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-60"
        >
          {pending ? "Stopping…" : "Stop impersonating"}
        </button>
      </p>
    );
  }

  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Signed in as <span className="font-medium text-foreground">{email}</span>.{" "}
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={pending}
        className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </p>
  );
}
