import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5",
    "text-xs font-medium tracking-tight",
    "transition-colors duration-200",
    "focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: ["border-transparent bg-primary/10 text-primary"].join(" "),
        secondary: [
          "border-transparent bg-secondary text-secondary-foreground",
        ].join(" "),
        destructive: [
          "border-transparent bg-destructive/10 text-destructive",
        ].join(" "),
        outline: ["border-border text-foreground"].join(" "),
        success: [
          "border-transparent bg-success-100 text-success-800",
          "dark:bg-success-900 dark:text-success-200",
        ].join(" "),
        warning: [
          "border-transparent bg-warning-100 text-warning-800",
          "dark:bg-warning-900 dark:text-warning-200",
        ].join(" "),
        danger: [
          "border-transparent bg-danger-100 text-danger-800",
          "dark:bg-danger-900 dark:text-danger-200",
        ].join(" "),
        info: [
          "border-transparent bg-info-100 text-info-800",
          "dark:bg-info-900 dark:text-info-200",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// Renders a span so badges are valid inside inline/phrasing contexts (e.g. <p>).
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
