import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_NAV, siteConfig } from "@/lib/site-config";
import { initials } from "@/lib/utils";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const name = admin.full_name ?? admin.email ?? "Case manager";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-foreground text-background">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/admin/pipeline" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-6" aria-hidden="true" />
            <span className="text-lg">{siteConfig.name}</span>
            <span className="rounded bg-background/15 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
              Ops
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-3">
            <span className="hidden text-xs text-background/70 sm:inline">
              Data layer: {db.kind === "supabase" ? "Supabase" : "local dev store"}
            </span>
            <Link href="/" className="hidden text-sm underline-offset-4 hover:underline sm:inline">
              View public site
            </Link>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-background/15 text-sm font-semibold"
              >
                {initials(name)}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </div>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-background hover:bg-background/15 hover:text-background"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="mb-4 lg:mb-0">
          <DashboardNav items={ADMIN_NAV} />
        </aside>
        <main id="main" className="min-w-0 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
