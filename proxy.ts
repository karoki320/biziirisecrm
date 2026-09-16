import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and gates the two private surfaces.
 *
 * Two deliberate properties:
 *  - The matcher covers ONLY /portal, /admin and /login. Marketing pages never
 *    invoke this, so they stay fully static and cost no auth round-trip.
 *  - If Supabase is not configured yet (Phase 1), private routes fall through
 *    instead of throwing. The public site must never 500 because a backend
 *    that is not live yet has no keys.
 *
 * Authorisation itself lives in RLS. This only decides who sees a page shell.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Already signed in and sitting on /login — send them where they belong.
  if (pathname === "/login") {
    if (!user) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/login"],
};
