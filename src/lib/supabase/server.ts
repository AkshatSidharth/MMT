import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "./config";

/** Request-scoped client that carries the signed-in user's session cookies. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render, where cookies are read-only.
          // Session refresh is handled by middleware instead.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS, so it is only used from server code that
 * has already authorised the caller (server actions and route handlers).
 */
export function createSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin and server-action database access.",
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
