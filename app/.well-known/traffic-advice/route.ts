import { discoveryJson } from "@/lib/discovery";
import { getTrafficAdvice } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getTrafficAdvice());
}
