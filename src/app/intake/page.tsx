import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { IntakeWizard } from "@/components/intake/intake-wizard";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Start your case",
  description:
    "Tell us what treatment you need, share your reports and your travel window. A case manager reviews your case and comes back with matched hospitals and one clear quote.",
};

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { treatment } = await searchParams;
  const user = await requirePatient("/intake");

  const [treatments, profile, existing] = await Promise.all([
    db.listTreatments(),
    db.getProfile(user.id),
    db.listCasesByPatient(user.id),
  ]);

  // One open case at a time: a second treatment is handled by the case manager.
  if (existing.length > 0) redirect("/dashboard/case");

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartPulse className="size-6 text-primary" aria-hidden="true" />
            <span className="text-lg">{siteConfig.name}</span>
          </Link>
          <p className="ms-auto text-sm text-muted-foreground">Free · No payment required</p>
        </div>
      </header>

      <main id="main" className="flex-1 px-4 py-10">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">Tell us about your case</h1>
          <p className="mt-3 text-muted-foreground">
            Five short steps, about three minutes. Everything you share is confidential and you can
            change it later.
          </p>
        </div>
        <IntakeWizard
          treatments={treatments}
          initialTreatmentSlug={treatment}
          defaultName={profile?.full_name ?? user.full_name ?? ""}
          defaultCountry={profile?.nationality ?? ""}
        />
      </main>
    </div>
  );
}
