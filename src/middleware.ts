import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session cookie fresh on navigation. Route protection lives
 * in the server layouts under /dashboard and /admin, which is where the role is
 * actually known.
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
