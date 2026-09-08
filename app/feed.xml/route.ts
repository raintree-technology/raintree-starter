import { discoveryResponse } from "@/lib/discovery";
import { getFeedXml } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryResponse(
    await getFeedXml(),
    "application/rss+xml; charset=utf-8",
  );
}
