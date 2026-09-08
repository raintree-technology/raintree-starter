import { discoveryJson } from "@/lib/discovery";
import { getWebsiteSpecJson } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getWebsiteSpecJson());
}
