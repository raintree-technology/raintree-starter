"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";

export default function GlobalError({
  error,
  retry: retryAction,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const retry = retryAction ?? reset;
  const page = ERROR_PAGES.serverError;
  const actions = STANDARD_ERROR_ACTIONS.site;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          colorScheme: "light dark",
          background: "Canvas",
          color: "CanvasText",
          fontFamily:
            'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <title>{page.title}</title>
        <main
          id="main-content"
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section aria-live="assertive" role="alert" style={{ maxWidth: 560 }}>
            <Link
              href="/"
              aria-label="Next Starter home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 40,
                color: "inherit",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg
                aria-hidden="true"
                width="32"
                height="32"
                viewBox="0 0 64 64"
              >
                <path
                  d="M32 6 51 29h-8l14 17H38v12H26V46H7l14-17h-8L32 6Zm0 18-7 9 7 9 7-9-7-9Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  transform="rotate(180 32 32)"
                />
              </svg>
              Next Starter
            </Link>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                opacity: 0.72,
              }}
            >
              {page.status}
            </p>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                lineHeight: 1.05,
                margin: "0 0 1rem",
              }}
            >
              {page.title}
            </h1>
            <p style={{ lineHeight: 1.6, margin: "0 0 1.5rem" }}>
              {page.description}
            </p>
            {error.digest ? (
              <p
                style={{
                  border:
                    "1px solid color-mix(in srgb, CanvasText 22%, transparent)",
                  fontFamily:
                    '"Geist Mono", "Geist Mono Fallback", ui-monospace, SFMono-Regular, Consolas, monospace',
                  fontSize: 13,
                  lineHeight: 1.5,
                  margin: "0 0 1.5rem",
                  opacity: 0.76,
                  padding: "8px 10px",
                }}
              >
                Error reference: {error.digest}
              </p>
            ) : null}
            {retry ? (
              <button
                type="button"
                onClick={retry}
                style={{
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1px solid currentColor",
                  background: "CanvasText",
                  color: "Canvas",
                  font: "inherit",
                }}
              >
                Try again
              </button>
            ) : null}
            {actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  marginLeft: retry || index > 0 ? 12 : 0,
                  color: "inherit",
                  textUnderlineOffset: 4,
                }}
              >
                {action.label}
              </Link>
            ))}
          </section>
        </main>
      </body>
    </html>
  );
}
