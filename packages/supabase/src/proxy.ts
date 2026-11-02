import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseBrowserEnv } from "./env";
import type { Database } from "./types";

export async function updateSession(request: NextRequest, options: { staffOnly?: boolean } = {}) {
  const { publishableKey, url } = getSupabaseBrowserEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (options.staffOnly) {
    // Do not cache authentication redirects or refreshed session cookies.
    response.headers.set("Cache-Control", "private, no-store");
    const publicPath = request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/auth/confirm";
    const destination = !user || error
      ? (publicPath ? null : "/login")
      : !["admin", "staff"].includes(user.app_metadata.role)
        ? (request.nextUrl.pathname === "/access-denied" || publicPath ? null : "/access-denied")
        : null;

    if (destination) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      url.search = "";
      const redirect = NextResponse.redirect(url, 303);
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      redirect.headers.set("Cache-Control", "private, no-store");
      return redirect;
    }
  }

  return response;
}
