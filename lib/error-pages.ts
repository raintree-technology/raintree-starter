import type { Route } from "next";

export type StandardErrorAction = {
  href: Route;
  label: string;
  icon: "home" | "dashboard";
  variant?: "default" | "outline";
};

export const ERROR_PAGES = {
  notFound: {
    status: "404",
    title: "We could not find that page.",
    description:
      "The link may be outdated, the page may have moved, or the address may be incorrect.",
  },
  serverError: {
    status: "500",
    title: "Something went wrong.",
    description:
      "The site hit an unexpected problem. You can try again or return to a known page.",
  },
} as const;

export const STANDARD_ERROR_ACTIONS = {
  site: [
    { href: "/", label: "Go home", icon: "home" },
    {
      href: "/dashboard",
      label: "Open dashboard",
      icon: "dashboard",
      variant: "outline",
    },
  ],
  app: [
    {
      href: "/dashboard",
      label: "Open dashboard",
      icon: "dashboard",
      variant: "outline",
    },
  ],
} as const satisfies Record<string, readonly StandardErrorAction[]>;
