import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Canonical status presentation. The brand is monochrome, so tones are
 * differentiated primarily by weight and shape (dot fill, border style) rather
 * than hue, and the label always carries the meaning on its own. `critical`
 * additionally uses the destructive tokens — the one sanctioned accent.
 */
export type StatusTone =
  | "positive"
  | "neutral"
  | "attention"
  | "critical"
  | "muted";

const TONE_STYLES: Record<StatusTone, { badge: string; dot: string }> = {
  positive: {
    badge: "border-transparent bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  neutral: {
    badge: "border-transparent bg-secondary text-secondary-foreground",
    dot: "border border-muted-foreground/60 bg-transparent",
  },
  attention: {
    badge: "border-dashed border-foreground/50 bg-transparent text-foreground",
    dot: "border-2 border-foreground bg-transparent",
  },
  critical: {
    badge: "border-transparent bg-destructive text-destructive-foreground",
    dot: "bg-destructive-foreground",
  },
  muted: {
    badge: "border-transparent bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
}

export function StatusBadge({
  tone,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const styles = TONE_STYLES[tone];
  return (
    <Badge className={cn("gap-1.5", styles.badge, className)} {...props}>
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", styles.dot)}
      />
      {children}
    </Badge>
  );
}

/** Map a Stripe subscription status to a tone + human label. */
export function subscriptionStatusPresentation(status: string): {
  tone: StatusTone;
  label: string;
} {
  switch (status) {
    case "active":
      return { tone: "positive", label: "Active" };
    case "trialing":
      return { tone: "positive", label: "Trial" };
    case "past_due":
      return { tone: "attention", label: "Past due" };
    case "unpaid":
      return { tone: "critical", label: "Unpaid" };
    case "canceled":
      return { tone: "muted", label: "Canceled" };
    case "incomplete":
    case "incomplete_expired":
      return { tone: "attention", label: "Incomplete" };
    default:
      return { tone: "neutral", label: status.replace(/_/g, " ") };
  }
}
