"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeartPulse, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { NavIcon } from "@/components/site/nav-icon";
import { PUBLIC_NAV, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { Language, User } from "@/lib/types";

export function SiteHeader({
  user,
  language,
}: {
  user: Pick<User, "role" | "full_name"> | null;
  language: Language;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const accountHref = user?.role === "admin" ? "/admin/pipeline" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <HeartPulse className="size-6 text-primary" aria-hidden="true" />
          <span className="text-lg">{siteConfig.name}</span>
        </Link>

        <nav aria-label="Main" className="ms-4 hidden flex-1 items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1 lg:ms-0">
          <LanguageSwitcher current={language} />

          {user ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={accountHref}>
                {user.role === "admin" ? "Admin panel" : "My dashboard"}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">
                <LogIn className="size-4" aria-hidden="true" />
                Sign In
              </Link>
            </Button>
          )}

          {/* The primary CTA stays visible at every width, abbreviated on phones. */}
          <Button asChild size="sm">
            <Link href="/cost-estimator">
              <span className="hidden sm:inline">Get Free Estimate</span>
              <span className="sm:hidden">Estimate</span>
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t bg-background lg:hidden">
          <nav aria-label="Main" className="container flex flex-col gap-1 py-3">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
            <Link
              href={user ? accountHref : "/sign-in"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
            >
              <NavIcon name="log-in" />
              {user ? (user.role === "admin" ? "Admin panel" : "My dashboard") : "Sign In"}
            </Link>
            <Button asChild className="mt-2">
              <Link href="/cost-estimator" onClick={() => setOpen(false)}>
                Get Free Estimate
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
