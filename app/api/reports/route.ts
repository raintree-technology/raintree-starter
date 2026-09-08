import { runAfterResponse } from "@/lib/after";
import { createRequestLogger, durationMs } from "@/lib/logger";
import {
  apiOptionsResponse,
  noStoreJson,
  noStoreText,
} from "@/lib/route-handlers";

export const OPTIONS = apiOptionsResponse;

export async function POST(request: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(request, { route: "api.reports" });
  const body = await request.text().catch((err) => {
    log.warn({ err }, "security.report.read_failed");
    return "";
  });
  const contentType = request.headers.get("content-type");
  runAfterResponse(
    "security.report.received",
    () => {
      log.info(
        {
          status: 204,
          contentType,
          bodyLength: body.length,
          durationMs: durationMs(startedAt),
        },
        "security.report.received",
      );
    },
    { route: "api.reports", status: 204 },
  );
  return noStoreText(null, { status: 204 });
}

export function GET(request: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(request, { route: "api.reports" });
  runAfterResponse(
    "security.report.endpoint_checked",
    () => {
      log.info(
        { status: 200, durationMs: durationMs(startedAt) },
        "security.report.endpoint_checked",
      );
    },
    { route: "api.reports", status: 200 },
  );

  return noStoreJson({
    ok: true,
    accepts: ["application/reports+json", "application/csp-report"],
  });
}
