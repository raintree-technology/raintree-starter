import {
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
  type UIMessage,
} from "ai";
import { runAfterResponse } from "@/lib/after";
import { getAiModel, isAiConfigured } from "@/lib/ai";
import { chatRequestSchema } from "@/lib/ai-schema";
import { features } from "@/lib/config";
import { saveChat } from "@/lib/data/chat";
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

export async function POST(req: Request) {
  const startedAt = performance.now();
  const log = createRequestLogger(req, { route: "api.chat" });

  try {
    if (!features.aiChat) {
      log.info(
        { status: 404, durationMs: durationMs(startedAt) },
        "chat.request.disabled",
      );
      return noStoreText("Not found", { status: 404 });
    }

    if (!isAiConfigured) {
      log.warn(
        { status: 503, durationMs: durationMs(startedAt) },
        "chat.request.unconfigured",
      );
      return noStoreText("AI is not configured", { status: 503 });
    }

    const session = await getSession();
    if (!session) {
      log.warn(
        { status: 401, durationMs: durationMs(startedAt) },
        "chat.request.unauthorized",
      );
      return noStoreText("Unauthorized", { status: 401 });
    }

    const parsed = await parseJsonBody(req, chatRequestSchema);
    if (!parsed.ok) {
      log.warn(
        { status: 400, durationMs: durationMs(startedAt) },
        "chat.request.invalid",
      );
      return parsed.response;
    }

    const validation = await safeValidateUIMessages<UIMessage>({
      messages: parsed.data.messages,
    });
    if (!validation.success) {
      log.warn(
        {
          status: 400,
          durationMs: durationMs(startedAt),
          err: validation.error,
        },
        "chat.request.invalid_messages",
      );
      return noStoreText("Invalid messages", { status: 400 });
    }

    const usageResponse = await checkAiUsage(session.user.id);
    if (usageResponse) return usageResponse;

    const { id } = parsed.data;
    const messages = validation.data;
    const context = {
      userId: session.user.id,
      chatId: id,
      inputMessageCount: messages.length,
    };

    log.info(context, "chat.stream.started");
    const result = streamText({
      model: getAiModel(),
      maxOutputTokens: 2048,
      system:
        "You are a helpful assistant embedded in a SaaS app. Be concise and friendly.",
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: ({ messages: finalMessages }) => {
        runAfterResponse(
          "chat.stream.finished",
          async () => {
            if (features.aiPersist) {
              await saveChat({
                chatId: id,
                userId: session.user.id,
                messages: finalMessages,
              });
            }
            log.info(
              {
                ...context,
                finalMessageCount: finalMessages.length,
                persisted: features.aiPersist,
                durationMs: durationMs(startedAt),
              },
              "chat.stream.finished",
            );
          },
          { route: "api.chat", ...context },
        );
      },
    });
  } catch (err) {
    log.error(
      { err, durationMs: durationMs(startedAt) },
      "chat.request.failed",
    );
    throw err;
  }
}
