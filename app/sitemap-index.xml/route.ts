import { discoveryResponse } from "@/lib/discovery";
import { getSitemapIndexXml } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryResponse(
    await getSitemapIndexXml(),
    "application/xml; charset=utf-8",
  );
}
