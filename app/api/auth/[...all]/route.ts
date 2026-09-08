import { toNextJsHandler } from "better-auth/next-js";
import { runAfterResponse } from "@/lib/after";
import { auth } from "@/lib/auth";
import { createRequestLogger, durationMs } from "@/lib/logger";
import { apiOptionsResponse } from "@/lib/route-handlers";

/**
 * Better Auth catch-all handler. Serves every auth endpoint (sign-in/up,
 * OAuth callbacks, 2FA, passkeys, magic link, organizations, admin) and the
 * Stripe webhook at /api/auth/stripe/webhook.
 *
 * Runs on the Node.js runtime (default) — Better Auth + the Stripe/Resend SDKs
 * need Node APIs, and this route performs database writes.
 */
const handlers = toNextJsHandler(auth);

function withAuthLogging(
  handler: (request: Request) => Response | Promise<Response>,
) {
  return async (request: Request) => {
    const startedAt = performance.now();
    const log = createRequestLogger(request, { route: "api.auth" });

    try {
      const response = await handler(request);
      runAfterResponse(
        "auth.request.completed",
        () => {
          log.info(
            { status: response.status, durationMs: durationMs(startedAt) },
            "auth.request.completed",
          );
        },
        { route: "api.auth", status: response.status },
      );
      return response;
    } catch (err) {
      log.error(
        { err, durationMs: durationMs(startedAt) },
        "auth.request.failed",
      );
      throw err;
    }
  };
}

export const GET = withAuthLogging(handlers.GET);
export const POST = withAuthLogging(handlers.POST);
export const OPTIONS = apiOptionsResponse;
