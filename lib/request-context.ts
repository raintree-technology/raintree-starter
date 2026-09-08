import "server-only";

import { createRequestLogger } from "@/lib/logger";

export type RequestContext = {
  requestId: string;
  log: ReturnType<typeof createRequestLogger>;
};

export function requestContext(request: Request): RequestContext {
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    crypto.randomUUID();
  return {
    requestId,
    log: createRequestLogger(request, { requestId }),
  };
}

export async function withRequestContext(
  request: Request,
  handler: (context: RequestContext) => Promise<Response> | Response,
): Promise<Response> {
  const context = requestContext(request);
  const response = await handler(context);
  response.headers.set("x-request-id", context.requestId);
  return response;
}
