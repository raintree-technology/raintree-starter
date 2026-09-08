import { text } from "@/lib/discovery";
import { getLlmsFullTxt } from "@/lib/discovery-cache";

export async function GET() {
  return text(await getLlmsFullTxt());
}
