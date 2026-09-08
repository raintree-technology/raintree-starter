import { plainText } from "@/lib/discovery";
import { getSecurityTxt } from "@/lib/discovery-cache";

export async function GET() {
  return plainText(await getSecurityTxt());
}
