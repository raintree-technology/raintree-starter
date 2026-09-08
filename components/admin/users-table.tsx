"use client";

import { MoreHorizontal, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/settings/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  emailVerified: boolean;
  createdAt: Date;
};

type AdminActionResult = { error?: { message?: string } | null };

type PendingAction = {
  type: "impersonate" | "role" | "ban" | "unban" | "delete";
  user: AdminUser;
};

const ACTION_COPY: Record<
  PendingAction["type"],
  {
    title: (user: AdminUser) => string;
    description: (user: AdminUser) => string;
    confirmLabel: string;
    destructive: boolean;
    successToast: (user: AdminUser) => string;
  }
> = {
  impersonate: {
    title: (u) => `Impersonate ${u.name}?`,
    description: (u) =>
      `You will be signed in as ${u.email} and taken to their dashboard. Everything you do runs as them until you stop impersonating from the banner.`,
    confirmLabel: "Impersonate",
    destructive: false,
    successToast: (u) => `Now impersonating ${u.name}`,
  },
  role: {
    title: (u) =>
      u.role === "admin"
        ? `Revoke admin from ${u.name}?`
        : `Make ${u.name} an admin?`,
    description: (u) =>
      u.role === "admin"
        ? `${u.email} will lose access to the admin console and user management immediately.`
        : `${u.email} will be able to manage, ban, impersonate, and delete every user on the platform.`,
    confirmLabel: "Change role",
    destructive: false,
    successToast: (u) =>
      u.role === "admin"
        ? `Admin revoked from ${u.name}`
        : `${u.name} is now an admin`,
  },
  ban: {
    title: (u) => `Ban ${u.name}?`,
    description: (u) =>
      `${u.email} will be signed out and blocked from signing in until unbanned. Their data is kept.`,
    confirmLabel: "Ban user",
    destructive: true,
    successToast: (u) => `${u.name} banned`,
  },
  unban: {
    title: (u) => `Unban ${u.name}?`,
    description: (u) => `${u.email} will be able to sign in again immediately.`,
    confirmLabel: "Unban user",
    destructive: false,
    successToast: (u) => `${u.name} unbanned`,
  },
  delete: {
    title: (u) => `Delete ${u.name}?`,
    description: (u) =>
      `This permanently deletes ${u.email}, their sessions, and their account data. This cannot be undone.`,
    confirmLabel: "Delete user",
    destructive: true,
    successToast: (u) => `${u.name} deleted`,
  },
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyUserIds, setBusyUserIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  // `pending` survives dialog close so the copy doesn't blank mid exit animation.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  const setUserBusy = useCallback((userId: string, busy: boolean) => {
    setBusyUserIds((current) => {
      const next = new Set(current);

      if (busy) {
        next.add(userId);
      } else {
        next.delete(userId);
      }

      return next;
    });
  }, []);

  const run = useCallback(
    async (
      user: AdminUser,
      action: PendingAction["type"],
      fn: () => Promise<AdminActionResult>,
    ) => {
      setUserBusy(user.id, true);
      try {
        const { error } = await fn();
        if (error) {
          toast.error(error.message ?? "Action failed");
          return false;
        }
        toast.success(ACTION_COPY[action].successToast(user));
        router.refresh();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Action failed"));
        return false;
      } finally {
        setUserBusy(user.id, false);
      }
    },
    [router, setUserBusy],
  );

  const executePending = useCallback(async (): Promise<boolean> => {
    if (!pending) return true;
    const { type, user } = pending;

    switch (type) {
      case "impersonate": {
        setUserBusy(user.id, true);
        try {
          const { error } = await authClient.admin.impersonateUser({
            userId: user.id,
          });
          if (error) {
            toast.error(error.message ?? "Could not impersonate");
            return false;
          }
          router.push("/dashboard");
          router.refresh();
          return true;
        } catch (error) {
          toast.error(getErrorMessage(error, "Could not impersonate"));
          return false;
        } finally {
          setUserBusy(user.id, false);
        }
      }
      case "role":
        return run(user, type, () =>
          authClient.admin.setRole({
            userId: user.id,
            role: user.role === "admin" ? "user" : "admin",
          }),
        );
      case "ban":
        return run(user, type, () =>
          authClient.admin.banUser({ userId: user.id }),
        );
      case "unban":
        return run(user, type, () =>
          authClient.admin.unbanUser({ userId: user.id }),
        );
      case "delete":
        return run(user, type, () =>
          authClient.admin.removeUser({ userId: user.id }),
        );
    }
  }, [pending, router, run, setUserBusy]);

  const requestAction = useCallback(
    (type: PendingAction["type"], user: AdminUser) => {
      setPending({ type, user });
      setConfirmOpen(true);
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users by name or email"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length === users.length
            ? `${users.length} ${users.length === 1 ? "user" : "users"}`
            : `${filtered.length} of ${users.length} users`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border">
          {query.trim() ? (
            <EmptyState
              icon={Users}
              title="No users match your search"
              description={`Nothing matched “${query.trim()}”. Try a different name or email.`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState icon={Users} title="No users yet" />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableCaption className="sr-only">
              Admin users with role, verification, ban status, and available
              account actions.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">User</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  isBusy={busyUserIds.has(user.id)}
                  onRequestAction={requestAction}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={pending ? ACTION_COPY[pending.type].title(pending.user) : ""}
        description={
          pending ? ACTION_COPY[pending.type].description(pending.user) : ""
        }
        confirmLabel={
          pending ? ACTION_COPY[pending.type].confirmLabel : "Confirm"
        }
        confirmVariant={
          pending && ACTION_COPY[pending.type].destructive
            ? "destructive"
            : "default"
        }
        onConfirm={executePending}
      />
    </div>
  );
}

const UserRow = memo(function UserRow({
  user,
  isSelf,
  isBusy,
  onRequestAction,
}: {
  user: AdminUser;
  isSelf: boolean;
  isBusy: boolean;
  onRequestAction: (type: PendingAction["type"], user: AdminUser) => void;
}) {
  const isAdmin = user.role === "admin";

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {user.name}
            {isSelf && (
              <span className="ml-1.5 text-footnote font-normal">(you)</span>
            )}
          </p>
          <p className="truncate text-footnote">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={isAdmin ? "default" : "secondary"}
          className="capitalize"
        >
          {user.role ?? "user"}
        </Badge>
      </TableCell>
      <TableCell>
        {user.banned ? (
          <StatusBadge tone="critical">Banned</StatusBadge>
        ) : user.emailVerified ? (
          <StatusBadge tone="positive">Active</StatusBadge>
        ) : (
          <StatusBadge tone="attention">Unverified</StatusBadge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isBusy}>
              <MoreHorizontal />
              <span className="sr-only">Actions for {user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={isBusy || isSelf}
              onClick={() => onRequestAction("impersonate", user)}
            >
              Impersonate
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => onRequestAction("role", user)}
            >
              {isAdmin ? "Revoke admin" : "Make admin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.banned ? (
              <DropdownMenuItem
                disabled={isBusy}
                onClick={() => onRequestAction("unban", user)}
              >
                Unban
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={isBusy || isSelf}
                onClick={() => onRequestAction("ban", user)}
              >
                Ban
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={isBusy || isSelf}
              className="text-destructive"
              onClick={() => onRequestAction("delete", user)}
            >
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
