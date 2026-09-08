import { discoveryJson } from "@/lib/discovery";
import { getAgentSkills } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getAgentSkills());
}
