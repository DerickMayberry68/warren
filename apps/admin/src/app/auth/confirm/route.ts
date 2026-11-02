import { createClient } from "@warren/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = request.nextUrl.clone();
  destination.search = "";
  destination.pathname = "/login";
  if (token_hash && (type === "invite" || type === "recovery")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) destination.pathname = "/set-password";
    else destination.searchParams.set("error", "expired-link");
  } else {
    destination.searchParams.set("error", "expired-link");
  }
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
