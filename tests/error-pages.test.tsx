import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootError from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound from "@/app/not-found";
import { ERROR_PAGES } from "@/lib/error-pages";

const rootErrorSource = readFileSync(
  join(process.cwd(), "app/error.tsx"),
  "utf8",
);
const globalErrorSource = readFileSync(
  join(process.cwd(), "app/global-error.tsx"),
  "utf8",
);
const appErrorSource = readFileSync(
  join(process.cwd(), "app/(app)/error.tsx"),
  "utf8",
);
const appLayoutSource = readFileSync(
  join(process.cwd(), "app/(app)/layout.tsx"),
  "utf8",
);
const authLayoutSource = readFileSync(
  join(process.cwd(), "app/(auth)/layout.tsx"),
  "utf8",
);
const marketingLayoutSource = readFileSync(
  join(process.cwd(), "app/(marketing)/layout.tsx"),
  "utf8",
);
const settingsLayoutSource = readFileSync(
  join(process.cwd(), "app/(app)/settings/layout.tsx"),
  "utf8",
);
const recoverableBoundarySource = readFileSync(
  join(process.cwd(), "components/error-boundary.tsx"),
  "utf8",
);
const static404 = readFileSync(join(process.cwd(), "public/404.html"), "utf8");
const static500 = readFileSync(join(process.cwd(), "public/500.html"), "utf8");

describe("custom error pages", () => {
  it("renders a plain-language 404 with recovery links", () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain("404");
    expect(html).toContain(ERROR_PAGES.notFound.title);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain("Browse add-ons");
    expect(html).not.toContain("Open pricing");
  });

  it("renders root 500 copy without leaking exception messages", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <RootError
        error={Object.assign(new Error("database password leaked"), {
          digest: "digest-123",
        })}
        unstable_retry={() => {}}
      />,
    );

    expect(html).toContain("500");
    expect(html).toContain(ERROR_PAGES.serverError.title);
    expect(html).toContain("Error reference: digest-123");
    expect(html).toContain("Try again");
    expect(html).toContain("Go home");
    expect(html).not.toContain("database password leaked");
    consoleError.mockRestore();
  });

  it("renders full-document global 500 fallback with a safe support reference", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <GlobalError
        error={Object.assign(new Error("stack trace should stay private"), {
          digest: "digest-456",
        })}
        unstable_retry={() => {}}
      />,
    );

    expect(html).toContain("<html");
    expect(html).toContain("<title>Something went wrong.</title>");
    expect(html).toContain("Error reference: digest-456");
    expect(html).toContain("Open dashboard");
    expect(html).not.toContain("stack trace should stay private");
    consoleError.mockRestore();
  });

  it("keeps error boundaries from rendering sensitive error fields directly", () => {
    for (const source of [rootErrorSource, globalErrorSource, appErrorSource]) {
      expect(source).not.toContain("error.message");
      expect(source).not.toContain("error.stack");
      expect(source).toContain("error.digest");
    }

    expect(recoverableBoundarySource).not.toContain("error.message");
    expect(recoverableBoundarySource).not.toContain("error.stack");
  });

  it("uses Next component-level error recovery outside error file conventions", () => {
    expect(recoverableBoundarySource).toContain("unstable_catchError");
    expect(recoverableBoundarySource).toContain("unstable_retry");

    for (const source of [
      appLayoutSource,
      authLayoutSource,
      marketingLayoutSource,
      settingsLayoutSource,
    ]) {
      expect(source).toContain("RecoverableErrorBoundary");
    }

    for (const source of [rootErrorSource, globalErrorSource, appErrorSource]) {
      expect(source).not.toContain("unstable_catchError");
    }
  });

  it("ships static host-level fallbacks for app-down 404 and 500 responses", () => {
    expect(static404).toContain(`<h1>${ERROR_PAGES.notFound.title}</h1>`);
    expect(static404).toContain('href="/"');
    expect(static404).not.toContain("/pricing");
    expect(static500).toContain(`<h1>${ERROR_PAGES.serverError.title}</h1>`);
    expect(static500).toContain('href="/"');

    for (const source of [static404, static500]) {
      expect(source).toContain('name="robots" content="noindex, nofollow"');
      expect(source).not.toContain("stack");
      expect(source).not.toContain("Error:");
      expect(source).not.toContain("process.env");
    }
  });
});
