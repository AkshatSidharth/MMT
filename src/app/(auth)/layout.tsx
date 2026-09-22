import Link from "next/link";
import { cookies } from "next/headers";
import { HeartPulse } from "lucide-react";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { LANGUAGE_COOKIE } from "@/lib/language";
import { siteConfig } from "@/lib/site-config";
import type { Language } from "@/lib/types";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const language = (cookieStore.get(LANGUAGE_COOKIE)?.value ?? DEFAULT_LANGUAGE) as Language;

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartPulse className="size-6 text-primary" aria-hidden="true" />
            <span className="text-lg">{siteConfig.name}</span>
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher current={language} />
          </div>
        </div>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
