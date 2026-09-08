import { text } from "@/lib/discovery";
import { getLlmsTxt } from "@/lib/discovery-cache";

export async function GET() {
  return text(await getLlmsTxt());
}
