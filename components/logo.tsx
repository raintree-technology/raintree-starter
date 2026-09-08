import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { features } from "@/lib/config";
import { cn } from "@/lib/utils";

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

export type LogoProps = Omit<LinkProps, "children" | "href"> & {
  href?: LinkProps["href"];
  label?: string;
};

const logoClassName =
  "inline-flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-foreground";

export function Logo({
  className,
  href = "/",
  label = features.appName,
  ...props
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(logoClassName, className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
        focusable="false"
        viewBox="0 0 64 64"
      >
        <path
          clipRule="evenodd"
          d="M32 6 51 29h-8l14 17H38v12H26V46H7l14-17h-8L32 6Zm0 18-7 9 7 9 7-9-7-9Z"
          fill="currentColor"
          fillRule="evenodd"
          transform="rotate(180 32 32)"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
