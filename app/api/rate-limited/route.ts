import { boundedRetryAfter, noStoreNoIndexHeaders } from "@/lib/route-handlers";

const DEFAULT_RETRY_AFTER_SECONDS = 60;

function rateLimitHeaders(request: Request): Record<string, string> {
  return {
    ...noStoreNoIndexHeaders(),
    "Retry-After": boundedRetryAfter(request, DEFAULT_RETRY_AFTER_SECONDS),
  };
}

function rateLimited(request: Request): Response {
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: rateLimitHeaders(request) },
  );
}

export function GET(request: Request) {
  return rateLimited(request);
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
