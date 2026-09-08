import "server-only";
import type { z } from "zod";

type ParsedJson<T> = { ok: true; data: T } | { ok: false; response: Response };

const noStore = {
  "Cache-Control": "no-store",
} as const;

const noStoreNoIndex = {
  ...noStore,
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function withDefaultHeaders(
  defaults: Record<string, string>,
  init?: ResponseInit,
): ResponseInit {
  const headers = new Headers(defaults);
  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  return { ...init, headers };
}

export function boundedRetryAfter(
  request: Request,
  fallbackSeconds: number,
): string {
  const value = Number(new URL(request.url).searchParams.get("retryAfter"));
  if (!Number.isFinite(value) || value < 1) return String(fallbackSeconds);
  return String(Math.min(Math.ceil(value), 86_400));
}

export function noStoreNoIndexHeaders(
  headers?: Record<string, string>,
): Record<string, string> {
  return { ...noStoreNoIndex, ...headers };
}

export function noStoreText(
  body: BodyInit | null,
  init?: ResponseInit,
): Response {
  return new Response(body, withDefaultHeaders(noStore, init));
}

export function noStoreJson(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, withDefaultHeaders(noStore, init));
}

export function apiOptionsResponse(): Response {
  return noStoreText(null, { status: 204 });
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedJson<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: noStoreJson({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: noStoreJson(
        {
          error: "Invalid request body",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
