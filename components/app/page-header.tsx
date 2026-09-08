import type * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: React.ReactNode;
  /** Primary action(s), right-aligned on wide screens. */
  actions?: React.ReactNode;
}

/** Standard app page header: one h1, optional description, optional actions. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="text-headline">{title}</h1>
        {description ? (
          <p className="text-caption mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
