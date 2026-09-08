import { z } from "zod";
import { runAfterResponse } from "@/lib/after";
import {
  absoluteUrl,
  discoveryJson,
  publicRoutes,
  site,
} from "@/lib/discovery";
import { getAskInfo } from "@/lib/discovery-cache";
import { createRequestLogger, durationMs } from "@/lib/logger";
import { noStoreJson, parseJsonBody } from "@/lib/route-handlers";

const resources = publicRoutes.map((route) => ({
  title: route.title,
  url: absoluteUrl(route.path),
  markdown: route.markdown,
  description: route.description,
}));

const askRequestSchema = z
  .object({
    jsonrpc: z.string().optional(),
    id: z.union([z.string(), z.number(), z.null()]).optional(),
    query: z.string().optional(),
    params: z.object({ query: z.string().optional() }).optional(),
  })
  .passthrough();

export async function POST(request: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(request, { route: "ask" });

  try {
    const parsed = await parseJsonBody(request, askRequestSchema);
    if (!parsed.ok) {
      log.warn(
        { status: 400, durationMs: durationMs(startedAt) },
        "ask.query.invalid",
      );
      return parsed.response;
    }

    const input = parsed.data;
    const query = String(
      input?.query ?? input?.params?.query ?? "",
    ).toLowerCase();
    const matches = query
      ? resources.filter((resource) =>
          resource.title.toLowerCase().includes(query),
        )
      : resources;

    runAfterResponse(
      "ask.query.completed",
      () => {
        log.info(
          {
            queryLength: query.length,
            matchCount: matches.length,
            status: 200,
            durationMs: durationMs(startedAt),
          },
          "ask.query.completed",
        );
      },
      { route: "ask", status: 200 },
    );

    return noStoreJson({
      jsonrpc: input?.jsonrpc ?? "2.0",
      id: input?.id ?? null,
      result: {
        answer:
          matches.length > 0
            ? `Matched public ${site.name} resources are included in resources.`
            : "No exact public resource matched. Start with /llms.txt or /sitemap.xml.",
        resources: matches.length > 0 ? matches : resources,
      },
    });
  } catch (err) {
    log.error({ err, durationMs: durationMs(startedAt) }, "ask.query.failed");
    throw err;
  }
}

export async function GET(request: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(request, { route: "ask" });
  runAfterResponse(
    "ask.info",
    () => {
      log.info(
        {
          resourceCount: resources.length,
          status: 200,
          durationMs: durationMs(startedAt),
        },
        "ask.info",
      );
    },
    { route: "ask", status: 200 },
  );

  return discoveryJson(await getAskInfo());
}
