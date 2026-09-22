import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { LANGUAGE_COOKIE } from "@/lib/language";
import type { Language } from "@/lib/types";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const language = (cookieStore.get(LANGUAGE_COOKIE)?.value ?? DEFAULT_LANGUAGE) as Language;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={user ? { role: user.role, full_name: user.full_name } : null}
        language={language}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
