import { discoveryResponse } from "@/lib/discovery";
import { getSchemaMapXml } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryResponse(
    await getSchemaMapXml(),
    "application/xml; charset=utf-8",
  );
}
