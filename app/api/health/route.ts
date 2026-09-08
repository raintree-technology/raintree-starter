import { apiOptionsResponse, noStoreJson } from "@/lib/route-handlers";

export function GET() {
  return noStoreJson({ ok: true });
}

export function OPTIONS() {
  return apiOptionsResponse();
}
