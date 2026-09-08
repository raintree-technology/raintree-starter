import { features } from "@/lib/config";
import { boundedRetryAfter, noStoreNoIndexHeaders } from "@/lib/route-handlers";

const DEFAULT_RETRY_AFTER_SECONDS = 600;
const APP_NAME = features.appName;

function maintenanceHeaders(request: Request): Record<string, string> {
  return {
    ...noStoreNoIndexHeaders(),
    "Retry-After": boundedRetryAfter(request, DEFAULT_RETRY_AFTER_SECONDS),
  };
}

function wantsJson(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") return true;

  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}

function maintenance(request: Request): Response {
  const headers = maintenanceHeaders(request);

  if (wantsJson(request)) {
    return Response.json(
      {
        error: "Service unavailable",
        message: `${APP_NAME} is temporarily unavailable while scheduled work is completed.`,
      },
      { status: 503, headers },
    );
  }

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Maintenance · ${APP_NAME}</title>
    <style>
      :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
      body { min-height: 100dvh; margin: 0; display: grid; place-items: center; padding: 24px; }
      main { max-width: 36rem; }
      h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; margin: 0 0 1rem; }
      p { color: color-mix(in srgb, CanvasText 72%, Canvas); line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <h1>Maintenance in progress</h1>
      <p>${APP_NAME} is temporarily unavailable while scheduled work is completed. Please try again shortly.</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

export function GET(request: Request) {
  return maintenance(request);
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
