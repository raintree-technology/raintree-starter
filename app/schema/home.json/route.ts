import { discoveryJson } from "@/lib/discovery";
import { getHomeSchema } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getHomeSchema());
}
