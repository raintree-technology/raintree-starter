import { notFound } from "next/navigation";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { StructuredGenerator } from "@/components/ai/structured-generator";
import { PageHeader } from "@/components/app/page-header";
import { isAiConfigured } from "@/lib/ai";
import { features } from "@/lib/config";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Generate",
  description: "Generate structured AI output from the configured model.",
  path: "/dashboard/generate",
});

export default function GeneratePage() {
  if (!features.aiStructured) notFound();

  if (!isAiConfigured) {
    return (
      <div className="content-width py-8">
        <PageHeader
          title="Generate"
          description="Stream a typed object from the model and render it as UI."
        />
        <AiNotConfigured feature="structured generation" />
      </div>
    );
  }

  return <StructuredGenerator />;
}
