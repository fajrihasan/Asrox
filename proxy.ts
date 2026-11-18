import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  REMEMBER_SESSION_COOKIE,
  REMEMBER_SESSION_MAX_AGE,
} from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let refreshedCookies: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];
  const { url, publishableKey } = getSupabaseEnv();
  const rememberSession =
    request.cookies.get(REMEMBER_SESSION_COOKIE)?.value === "true";

  function getCookieOptions(options?: Record<string, unknown>) {
    const cookieOptions = { ...options };
    if (typeof cookieOptions.maxAge === "number" && cookieOptions.maxAge > 0) {
      if (rememberSession) {
        cookieOptions.maxAge = REMEMBER_SESSION_MAX_AGE;
      } else {
        delete cookieOptions.maxAge;
      }
    }
    return cookieOptions;
  }

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        refreshedCookies = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, getCookieOptions(options));
        });
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    refreshedCookies.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, getCookieOptions(options));
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/", "/reset-password"],
};
