import { features } from "@/lib/config";
import { discoveryJson } from "@/lib/discovery";
import { getPricingSchema } from "@/lib/discovery-cache";

import { noStoreJson } from "@/lib/route-handlers";

export async function GET() {
  if (!features.billing)
    return noStoreJson({ error: "Not found" }, { status: 404 });
  return discoveryJson(await getPricingSchema());
}
