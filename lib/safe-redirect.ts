import type { Route } from "next";

const INTERNAL_ORIGIN = "http://internal.local";

export function getSafeInternalRedirect(
  value: string | undefined,
  fallback: Route = "/dashboard",
): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}` as Route;
  } catch {
    return fallback;
  }
}
