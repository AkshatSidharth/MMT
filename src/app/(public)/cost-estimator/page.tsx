import type { Metadata } from "next";
import Link from "next/link";
import { CostEstimator } from "@/components/site/cost-estimator";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Cost estimator",
  description:
    "Compare the indicative cost of treatment in India with typical private costs in your home country, and get a detailed written estimate by email.",
};

export default async function CostEstimatorPage({
  searchParams,
}: {
  searchParams: Promise<{ treatment?: string }>;
}) {
  const { treatment } = await searchParams;
  const treatments = await db.listTreatments();

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Cost estimator</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Pick your treatment and your home country to see an indicative comparison. These are
            reference bands compiled from published data so you can plan — the real figure comes from
            the hospital once a doctor has read your reports, and we put it in writing with the
            breakdown.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <CostEstimator treatments={treatments} initialTreatmentSlug={treatment} />

        <div className="mt-12 rounded-lg border bg-secondary/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">What changes an estimate into a quote</h2>
          <ul className="prose-readable mt-4 grid gap-2 sm:grid-cols-2">
            <li>Your actual scans, lab results and discharge summaries.</li>
            <li>The doctor&apos;s assessment of what your case needs.</li>
            <li>Implant, stent or device choice, where the procedure uses one.</li>
            <li>How many nights you will be in hospital, and how many in intensive care.</li>
            <li>Whether any other condition needs treating first.</li>
            <li>Which hospital and city, and the season you travel in.</li>
          </ul>
          <Button asChild className="mt-6">
            <Link href="/sign-in?next=%2Fintake">Upload my reports for a real quote</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
