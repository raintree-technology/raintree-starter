import { markdown } from "@/lib/discovery";
import { getWebsiteSpecMarkdown } from "@/lib/discovery-cache";

export async function GET() {
  return markdown(await getWebsiteSpecMarkdown());
}
