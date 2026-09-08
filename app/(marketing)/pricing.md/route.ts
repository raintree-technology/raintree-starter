import { features } from "@/lib/config";
import { markdown } from "@/lib/discovery";
import { getPricingMarkdown } from "@/lib/discovery-cache";

import { noStoreText } from "@/lib/route-handlers";

export async function GET() {
  if (!features.billing) return noStoreText("Not found", { status: 404 });
  return markdown(await getPricingMarkdown());
}
