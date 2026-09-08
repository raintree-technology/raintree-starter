"use client";

import {
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Sun,
  UserCog,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { memo, type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { features } from "@/lib/config";
import { cn, getErrorMessage, initials } from "@/lib/utils";

type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type ShellUser = {
  name: string;
  email: string;
  image?: string | null;
};

type ShellOrg = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export interface AppShellProps {
  user: ShellUser;
  organizations: ShellOrg[];
  activeOrganization: ShellOrg | null;
  multiTenant: boolean;
  isAdmin: boolean;
  planLabel: string;
  /** True when an admin is impersonating this user's session. */
  impersonating?: boolean;
  children: ReactNode;
}

const AI_CHAT_NAV: NavItem[] = features.aiChat
  ? [{ href: "/dashboard/chat", label: "Chat", icon: MessageSquare }]
  : [];
const AI_GENERATE_NAV: NavItem[] = features.aiStructured
  ? [{ href: "/dashboard/generate", label: "Generate", icon: Sparkles }]
  : [];

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  ...AI_CHAT_NAV,
  ...AI_GENERATE_NAV,
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  ...NAV,
  { href: "/admin", label: "Admin", icon: Shield },
];

export function AppShell(props: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-dvh flex-col">
      {props.impersonating && <ImpersonationBanner user={props.user} />}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r bg-card/40 md:flex">
          <SidebarBody {...props} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBody {...props} onNavigate={closeMobileMenu} />
              </SheetContent>
            </Sheet>
            <Logo />
          </header>

          <main id="main-content" className="min-h-0 flex-1 overflow-y-auto">
            {props.children}
          </main>
        </div>
      </div>
    </div>
  );
}

function ImpersonationBanner({ user }: { user: ShellUser }) {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  async function stop() {
    if (stopping) return;
    setStopping(true);
    try {
      const { error } = await authClient.admin.stopImpersonating();
      if (error) {
        toast.error(error.message ?? "Could not stop impersonating");
        setStopping(false);
        return;
      }
      toast.success("Stopped impersonating");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not stop impersonating"));
      setStopping(false);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-dashed border-foreground/40 bg-secondary px-4 py-2 text-sm"
    >
      <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        You are impersonating <span className="font-medium">{user.name}</span> (
        {user.email}). Actions you take run as this user.
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={stopping}
        onClick={() => void stop()}
      >
        {stopping ? "Stopping…" : "Stop impersonating"}
      </Button>
    </div>
  );
}

type SidebarBodyProps = Omit<AppShellProps, "children"> & {
  onNavigate?: () => void;
};

const SidebarBody = memo(function SidebarBody({
  user,
  organizations,
  activeOrganization,
  multiTenant,
  isAdmin,
  planLabel,
  onNavigate,
}: SidebarBodyProps) {
  const pathname = usePathname();
  const nav = isAdmin ? ADMIN_NAV : NAV;

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="px-2 py-2">
        <Logo />
      </div>

      {multiTenant && (
        <OrgSwitcher
          organizations={organizations}
          activeOrganization={activeOrganization}
          onNavigate={onNavigate}
        />
      )}

      <nav className="mt-2 flex flex-col gap-1">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {features.billing && (
          <Link
            href="/settings/billing"
            onClick={onNavigate}
            aria-label={`Current plan: ${planLabel}. Manage billing`}
            className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Plan:{" "}
            <span className="font-medium text-foreground">{planLabel}</span>
          </Link>
        )}
        <UserMenu user={user} onNavigate={onNavigate} />
      </div>
    </div>
  );
});

const OrgSwitcher = memo(function OrgSwitcher({
  organizations,
  activeOrganization,
  onNavigate,
}: {
  organizations: ShellOrg[];
  activeOrganization: ShellOrg | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const current = activeOrganization ?? organizations[0] ?? null;

  async function switchTo(organizationId: string) {
    if (switching || organizationId === current?.id) return;
    setSwitching(true);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });
      if (error) {
        toast.error(error.message ?? "Could not switch organization");
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not switch organization"));
    } finally {
      setSwitching(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={switching}
          aria-label={
            current
              ? `Switch organization. Current: ${current.name}`
              : "Select organization"
          }
        >
          <span className="truncate">
            {switching
              ? "Switching…"
              : (current?.name ?? "Select organization")}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            disabled={switching}
            onClick={() => void switchTo(org.id)}
          >
            <span className="truncate">{org.name}</span>
            {org.id === current?.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" onClick={onNavigate}>
            <Plus className="mr-2 h-4 w-4" />
            Create organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

const UserMenu = memo(function UserMenu({
  user,
  onNavigate,
}: {
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message ?? "Could not sign out");
        setSigningOut(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not sign out"));
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 px-2 py-1.5"
          aria-label={`Account menu for ${user.name}`}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-left text-sm">
            {user.name}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" onClick={onNavigate}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
