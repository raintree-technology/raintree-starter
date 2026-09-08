import { discoveryJson } from "@/lib/discovery";
import { getApiCatalog } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getApiCatalog(), {
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8",
    },
  });
}
