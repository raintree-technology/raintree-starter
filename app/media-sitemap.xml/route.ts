import { discoveryResponse } from "@/lib/discovery";
import { getMediaSitemapXml } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryResponse(
    await getMediaSitemapXml(),
    "application/xml; charset=utf-8",
  );
}
