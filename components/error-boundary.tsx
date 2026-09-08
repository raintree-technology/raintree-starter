"use client";

import { AlertTriangle, Home, RotateCw } from "lucide-react";
import type { Route } from "next";
import { type ErrorInfo, unstable_catchError } from "next/error";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecoverableErrorBoundaryProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  homeHref?: Route;
  homeLabel?: string;
  align?: "start" | "center";
  className?: string;
};

function getDigest(error: Error): string | null {
  const digest = (error as Error & { digest?: unknown }).digest;
  return typeof digest === "string" && digest.length > 0 ? digest : null;
}

function RecoverableErrorFallback(
  {
    title = "Something went wrong.",
    description = "This section hit an unexpected problem. Try again, or return to a known page.",
    retryLabel = "Try again",
    homeHref,
    homeLabel = "Go home",
    align = "center",
    className,
  }: RecoverableErrorBoundaryProps,
  { error, unstable_retry }: ErrorInfo,
) {
  const digest = getDigest(error);

  // biome-ignore lint/correctness/useHookAtTopLevel: Next unstable_catchError renders this two-argument fallback as a component.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      aria-live="assertive"
      role="alert"
      className={cn(
        "flex min-h-[15rem] flex-col justify-center gap-4 rounded-lg border border-border bg-card/40 p-6",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-headline">{title}</h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {digest ? (
        <p className="border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
          Error reference: {digest}
        </p>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row",
          align === "center" ? "items-center justify-center" : "items-start",
        )}
      >
        <Button onClick={() => unstable_retry()}>
          <RotateCw />
          {retryLabel}
        </Button>
        {homeHref ? (
          <Button asChild variant="outline">
            <Link href={homeHref}>
              <Home />
              {homeLabel}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export const RecoverableErrorBoundary = unstable_catchError(
  RecoverableErrorFallback,
);
