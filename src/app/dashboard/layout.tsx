import Link from "next/link";
import { HeartPulse, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { requirePatient } from "@/lib/auth";
import { PATIENT_NAV, siteConfig } from "@/lib/site-config";
import { initials } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePatient();
  const name = user.full_name ?? user.email ?? user.phone ?? "Patient";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartPulse className="size-6 text-primary" aria-hidden="true" />
            <span className="hidden text-lg sm:inline">{siteConfig.name}</span>
          </Link>
          <div className="ms-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary"
              >
                {initials(name)}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="mb-4 lg:mb-0">
          <DashboardNav items={PATIENT_NAV} />
        </aside>
        <main id="main" className="min-w-0 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
