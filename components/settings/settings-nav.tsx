"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { features } from "@/lib/config";
import { cn } from "@/lib/utils";

type SettingsNavItem = { href: Route; label: string };

export function SettingsNav({ multiTenant }: { multiTenant: boolean }) {
  const pathname = usePathname();
  const teamItems: SettingsNavItem[] = multiTenant
    ? [{ href: "/settings/members", label: "Members" }]
    : [];
  const billingItems: SettingsNavItem[] = features.billing
    ? [{ href: "/settings/billing", label: "Billing" }]
    : [];

  const items: SettingsNavItem[] = [
    { href: "/settings", label: "Profile" },
    { href: "/settings/security", label: "Security" },
    ...teamItems,
    ...billingItems,
  ];

  return (
    <nav
      aria-label="Settings sections"
      className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col"
    >
      {items.map((item) => {
        const active =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
