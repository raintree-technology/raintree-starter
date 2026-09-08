import { discoveryJson } from "@/lib/discovery";
import { getFeedJson } from "@/lib/discovery-cache";

export async function GET() {
  return discoveryJson(await getFeedJson(), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
