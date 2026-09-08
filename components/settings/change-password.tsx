"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (current === next) {
      toast.error("New password must be different from your current password");
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(error.message ?? "Could not change password");
        return;
      }
      toast.success("Password changed");
      setCurrent("");
      setNext("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Change your password. Other sessions will be signed out.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-describedby="password-requirement"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <p id="password-requirement" className="text-footnote">
              Use at least 8 characters.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !current || !next}>
            {loading ? "Saving…" : "Change password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
