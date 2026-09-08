import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Honest unconfigured state for AI surfaces — shown instead of a chat/generator
 * that would fail on first use. Mirrors the billing panel's "not configured"
 * pattern for this developer-facing starter.
 */
export function AiNotConfigured({ feature }: { feature: string }) {
  return (
    <Card>
      <EmptyState
        icon={Sparkles}
        title="AI isn't configured yet"
        description={`Set AI_GATEWAY_API_KEY in your environment to enable ${feature}. Until then this page stays read-only instead of failing on send.`}
      />
    </Card>
  );
}
