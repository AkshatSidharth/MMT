import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { DEFAULT_LANGUAGE, languageOption } from "@/lib/i18n";
import { LANGUAGE_COOKIE } from "@/lib/language";
import type { Language } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sehat Bridge — World-class treatment in India, arranged for you",
    template: "%s · Sehat Bridge",
  },
  description:
    "We connect international patients with accredited Indian hospitals: share your case, get matched, consult a doctor and receive one clear quote. Indicative costs, confidential records, a named case manager.",
  openGraph: {
    title: "Sehat Bridge — World-class treatment in India, arranged for you",
    description:
      "Share your medical case, get matched with accredited Indian hospitals and receive one clear quote, with a named case manager throughout.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const language = (cookieStore.get(LANGUAGE_COOKIE)?.value ?? DEFAULT_LANGUAGE) as Language;
  const option = languageOption(language);

  return (
    /*
     * Browser extensions (screen recorders, grammar checkers, password managers)
     * routinely stamp attributes onto <html> and <body> before React hydrates,
     * which React would otherwise report as a hydration mismatch. This suppresses
     * the warning for these two elements' own attributes only — it does not reach
     * their descendants, so a genuine mismatch inside the app is still reported.
     */
    <html
      lang={option.code}
      dir={option.dir}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
