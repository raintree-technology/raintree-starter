import { Output, streamText } from "ai";
import { z } from "zod";
import { runAfterResponse } from "@/lib/after";
import { getAiModel, isAiConfigured } from "@/lib/ai";
import { generationSchema } from "@/lib/ai-schema";
import { features } from "@/lib/config";
import { createRequestLogger, durationMs } from "@/lib/logger";
import { checkAiUsage } from "@/lib/rate-limit";
import {
  apiOptionsResponse,
  noStoreText,
  parseJsonBody,
} from "@/lib/route-handlers";
import { getSession } from "@/lib/session";

export const maxDuration = 30;
export const OPTIONS = apiOptionsResponse;

const objectRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

export async function POST(req: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(req, { route: "api.ai.object" });

  try {
    if (!features.aiStructured) {
      log.info(
        { status: 404, durationMs: durationMs(startedAt) },
        "ai.object.request.disabled",
      );
      return noStoreText("Not found", { status: 404 });
    }

    if (!isAiConfigured) {
      log.warn(
        { status: 503, durationMs: durationMs(startedAt) },
        "ai.object.request.unconfigured",
      );
      return noStoreText("AI is not configured", { status: 503 });
    }

    const session = await getSession();
    if (!session) {
      log.warn(
        { status: 401, durationMs: durationMs(startedAt) },
        "ai.object.request.unauthorized",
      );
      return noStoreText("Unauthorized", { status: 401 });
    }

    const parsed = await parseJsonBody(req, objectRequestSchema);
    if (!parsed.ok) {
      log.warn(
        { status: 400, durationMs: durationMs(startedAt) },
        "ai.object.request.invalid",
      );
      return parsed.response;
    }

    const usageResponse = await checkAiUsage(session.user.id);
    if (usageResponse) return usageResponse;

    const { prompt } = parsed.data;
    log.info(
      { userId: session.user.id, promptLength: prompt.length },
      "ai.object.stream.started",
    );

    const result = streamText({
      model: getAiModel(),
      maxOutputTokens: 2048,
      output: Output.object({ schema: generationSchema }),
      prompt: `Generate a realistic project plan for the following idea: ${prompt}`,
    });

    runAfterResponse(
      "ai.object.stream.finished",
      () => {
        log.info(
          {
            userId: session.user.id,
            promptLength: prompt.length,
            durationMs: durationMs(startedAt),
          },
          "ai.object.stream.finished",
        );
      },
      { route: "api.ai.object", userId: session.user.id },
    );

    return result.toTextStreamResponse();
  } catch (err) {
    log.error(
      { err, durationMs: durationMs(startedAt) },
      "ai.object.request.failed",
    );
    throw err;
  }
}
