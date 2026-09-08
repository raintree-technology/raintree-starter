import { NextResponse } from "next/server";
import { absoluteUrl, discoveryCacheControl } from "@/lib/discovery";

export function GET() {
  const response = NextResponse.redirect(
    absoluteUrl("/settings/security"),
    302,
  );
  response.headers.set("Cache-Control", discoveryCacheControl);
  return response;
}
