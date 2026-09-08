import { markdown } from "@/lib/discovery";
import { getHomeMarkdown } from "@/lib/discovery-cache";

export async function GET() {
  return markdown(await getHomeMarkdown());
}
