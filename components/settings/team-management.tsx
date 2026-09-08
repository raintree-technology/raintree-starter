"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/settings/confirm-action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage, initials } from "@/lib/utils";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};
type Invitation = { id: string; email: string; role: string };

export function TeamManagement({
  members,
  invitations,
  currentUserId,
  canManage,
}: {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const inviteEmail = email.trim();
    if (!inviteEmail) {
      toast.error("Enter an email address");
      return;
    }

    setBusy("invite");
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: role as "member" | "admin" | "owner",
      });
      if (error) {
        toast.error(error.message ?? "Could not send invite");
        return;
      }
      toast.success(`Invitation sent to ${inviteEmail}`);
      setEmail("");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send invite"));
    } finally {
      setBusy(null);
    }
  }

  async function removeMember(memberId: string): Promise<boolean> {
    setBusy(memberId);
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
      if (error) {
        toast.error(error.message ?? "Could not remove member");
        return false;
      }
      toast.success("Member removed");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove member"));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function cancelInvite(invitationId: string): Promise<boolean> {
    setBusy(invitationId);
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) {
        toast.error(error.message ?? "Could not cancel invite");
        return false;
      }
      toast.success("Invitation cancelled");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not cancel invite"));
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a member</CardTitle>
            <CardDescription>
              Add people to this organization by email. On per-seat plans,
              billing updates automatically when members join or leave.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={invite}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@example.com"
                  maxLength={320}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="invite-role" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={busy !== null}>
                {busy === "invite" ? "Sending…" : "Invite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 && (
            <EmptyState
              size="inline"
              title="No members yet"
              description={
                canManage
                  ? "Invite the first member with the form above."
                  : "An owner or admin can invite members."
              }
            />
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.image ?? undefined} alt={m.name} />
                  <AvatarFallback>{initials(m.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.name}{" "}
                    {m.userId === currentUserId && (
                      <span className="text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-footnote">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={m.role === "member" ? "secondary" : "default"}
                  className="capitalize"
                >
                  {m.role}
                </Badge>
                {canManage &&
                  m.userId !== currentUserId &&
                  m.role !== "owner" && (
                    <ConfirmAction
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={busy !== null}
                          aria-label={`Remove ${m.name}`}
                          title={`Remove ${m.name}`}
                        >
                          <X className="text-muted-foreground" />
                        </Button>
                      }
                      title={`Remove ${m.name} from the organization?`}
                      description="They will lose access to this organization and its projects."
                      confirmLabel="Remove member"
                      onConfirm={() => removeMember(m.id)}
                      disabled={busy !== null}
                    />
                  )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{inv.email}</p>
                  <p className="text-footnote capitalize">{inv.role}</p>
                </div>
                <StatusBadge tone="attention">Pending</StatusBadge>
                {canManage && (
                  <ConfirmAction
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy !== null}
                      >
                        Cancel
                      </Button>
                    }
                    title="Cancel this invitation?"
                    description={`The invitation for ${inv.email} will no longer be usable.`}
                    confirmLabel="Cancel invitation"
                    onConfirm={() => cancelInvite(inv.id)}
                    disabled={busy !== null}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
