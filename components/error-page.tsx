import { Home, LayoutDashboard, type LucideIcon, RotateCw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { StandardErrorAction } from "@/lib/error-pages";

const actionIcons: Record<StandardErrorAction["icon"], LucideIcon> = {
  home: Home,
  dashboard: LayoutDashboard,
};

type StandardErrorPageProps = {
  status: string;
  title: string;
  description: string;
  actions: readonly StandardErrorAction[];
  reference?: string;
  onRetry?: () => void;
  retryLabel?: string;
  surface?: "page" | "section";
};

export function StandardErrorPage({
  status,
  title,
  description,
  actions,
  reference,
  onRetry,
  retryLabel = "Try again",
  surface = "page",
}: StandardErrorPageProps) {
  const content = (
    <>
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {status}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
        {reference ? (
          <p className="mt-4 max-w-xl border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
            Error reference: {reference}
          </p>
        ) : null}
      </div>
      <ErrorActions
        actions={actions}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />
    </>
  );

  if (surface === "section") {
    return (
      <section
        aria-live="assertive"
        role="alert"
        className="content-width flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center"
      >
        {content}
      </section>
    );
  }

  return (
    <main
      id="main-content"
      aria-live={status === "500" ? "assertive" : undefined}
      role={status === "500" ? "alert" : undefined}
      className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-4 py-16 sm:px-6"
    >
      <Logo className="mb-10" />
      {content}
    </main>
  );
}

function ErrorActions({
  actions,
  onRetry,
  retryLabel,
}: {
  actions: readonly StandardErrorAction[];
  onRetry?: () => void;
  retryLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      {onRetry ? (
        <Button onClick={onRetry}>
          <RotateCw />
          {retryLabel}
        </Button>
      ) : null}
      {actions.map((action, index) => {
        const Icon = actionIcons[action.icon];
        const variant =
          action.variant ?? (onRetry || index > 0 ? "outline" : "default");

        return (
          <Button key={action.href} asChild variant={variant}>
            <Link href={action.href as Route}>
              <Icon />
              {action.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
