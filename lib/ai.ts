import "server-only";
import { createGateway } from "@ai-sdk/gateway";
import { env } from "@/lib/env";

/**
 * Vercel AI Gateway: one key (AI_GATEWAY_API_KEY) routes to any provider model
 * by id (e.g. "openai/gpt-5-mini", "anthropic/claude-sonnet-4-5"). On Vercel,
 * OIDC is used automatically when no key is set.
 */
export const isAiConfigured =
  !!env.AI_GATEWAY_API_KEY || process.env.VERCEL === "1";

type AiGateway = ReturnType<typeof createGateway>;
type AiModel = ReturnType<AiGateway>;

let gateway: AiGateway | undefined;
let model: AiModel | undefined;

function getGateway(): AiGateway {
  if (!gateway) {
    gateway = createGateway(
      env.AI_GATEWAY_API_KEY ? { apiKey: env.AI_GATEWAY_API_KEY } : {},
    );
  }

  return gateway;
}

export function getAiModel(): AiModel {
  if (!model) {
    model = getGateway()(env.AI_MODEL);
  }

  return model;
}
