import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { REMEMBER_SESSION_MAX_AGE } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient({ rememberSession = false } = {}) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options };
          if (typeof cookieOptions.maxAge === "number" && cookieOptions.maxAge > 0) {
            if (rememberSession) {
              cookieOptions.maxAge = REMEMBER_SESSION_MAX_AGE;
            } else {
              delete cookieOptions.maxAge;
            }
          }
          cookieStore.set(name, value, cookieOptions);
        });
      },
    },
  });
}
