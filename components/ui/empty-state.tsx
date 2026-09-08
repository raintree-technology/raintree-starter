import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary next action (a Button or link). */
  action?: React.ReactNode;
  /** "panel" fills a content area; "inline" sits inside an existing card. */
  size?: "panel" | "inline";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "panel",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        size === "panel" ? "px-6 py-12" : "px-4 py-6",
        className,
      )}
      {...props}
    >
      {Icon ? (
        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-secondary">
          <Icon aria-hidden className="size-5 text-muted-foreground" />
        </div>
      ) : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
