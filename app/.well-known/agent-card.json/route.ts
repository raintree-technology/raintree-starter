import { discoveryJson } from "@/lib/discovery";
import { getAgentCard } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getAgentCard());
}
