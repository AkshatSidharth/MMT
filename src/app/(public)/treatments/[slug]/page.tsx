import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BedDouble, TrendingDown } from "lucide-react";
import { HospitalCard, TreatmentCard } from "@/components/site/cards";
import { IndicativeNote } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { COUNTRIES, countryName } from "@/lib/reference-data";
import { formatUsd, formatUsdBand } from "@/lib/utils";

export async function generateStaticParams() {
  const treatments = await db.listTreatments();
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const treatment = await db.getTreatmentBySlug(slug);
  if (!treatment) return { title: "Treatment not found" };
  return {
    title: treatment.name,
    description: `${treatment.description} Indicative cost in India ${formatUsdBand(treatment.indicative_cost_min, treatment.indicative_cost_max)}, with accredited hospitals and a named case manager.`,
  };
}

export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const treatment = await db.getTreatmentBySlug(slug);
  if (!treatment) notFound();

  const [hospitals, doctors, allTreatments] = await Promise.all([
    db.listHospitals({ treatmentSlug: slug }),
    db.listDoctors(),
    db.listTreatments(),
  ]);

  const related = allTreatments
    .filter((item) => item.category === treatment.category && item.slug !== treatment.slug)
    .slice(0, 3);

  // Only markets we hold a published reference figure for are compared.
  const comparisons = COUNTRIES.filter(
    (country) => typeof treatment.home_country_reference_costs[country.code] === "number",
  ).map((country) => {
    const homeCost = treatment.home_country_reference_costs[country.code];
    const indiaMid = Math.round(
      (treatment.indicative_cost_min + treatment.indicative_cost_max) / 2,
    );
    return {
      country,
      homeCost,
      saving: homeCost > indiaMid ? homeCost - indiaMid : null,
      percent: homeCost > indiaMid ? Math.round(((homeCost - indiaMid) / homeCost) * 100) : null,
    };
  });

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <Badge variant="outline">{treatment.category}</Badge>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{treatment.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{treatment.description}</p>
            {treatment.stay_summary && (
              <p className="mt-4 flex items-center gap-2 text-sm">
                <BedDouble className="size-4 text-primary" aria-hidden="true" />
                {treatment.stay_summary}
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardDescription>Indicative cost in India</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {formatUsdBand(treatment.indicative_cost_min, treatment.indicative_cost_max)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IndicativeNote>
                Indicative estimate from published reference data. Your final quote is confirmed
                after the doctor reviews your case, and it will state what is and is not included.
              </IndicativeNote>
              <Button asChild size="lg" className="w-full">
                <Link href={`/sign-in?next=${encodeURIComponent(`/intake?treatment=${slug}`)}`}>
                  Start my case for this treatment
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/cost-estimator?treatment=${slug}`}>Compare with my country</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="container py-12">
        {treatment.overview && (
          <section className="mb-14 max-w-3xl">
            <h2 className="text-2xl font-semibold">What this treatment involves</h2>
            <div className="prose-readable mt-4">
              <p>{treatment.overview}</p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              This is general information to help you prepare, not medical advice. Only the treating
              doctor can say what is right for your case.
            </p>
          </section>
        )}

        {comparisons.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-semibold">India compared with other countries</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Typical private-pay costs for the same procedure. In several of these countries the
              treatment may not be available locally at all, which is the usual reason patients
              travel.
            </p>
            <div className="mt-6 overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[540px] text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">Country</th>
                    <th className="px-4 py-3 text-start font-medium">Typical private cost</th>
                    <th className="px-4 py-3 text-start font-medium">In India (indicative)</th>
                    <th className="px-4 py-3 text-start font-medium">Indicative saving</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparisons.map((row) => (
                    <tr key={row.country.code}>
                      <td className="px-4 py-3 font-medium">{row.country.name}</td>
                      <td className="px-4 py-3">{formatUsd(row.homeCost)}</td>
                      <td className="px-4 py-3 text-primary">
                        {formatUsdBand(
                          treatment.indicative_cost_min,
                          treatment.indicative_cost_max,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.saving ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-success">
                            <TrendingDown className="size-4" aria-hidden="true" />
                            {formatUsd(row.saving)} ({row.percent}%)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <IndicativeNote className="mt-4">
              Reference figures compiled from publicly available data, rounded. They exclude flights
              and accommodation, and they are not quotations.
            </IndicativeNote>
          </section>
        )}

        <section className="mb-14">
          <h2 className="text-2xl font-semibold">
            Hospitals listed as offering {treatment.name.toLowerCase()}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Reference listings, shown for information. Your case manager confirms which of these
            actually suits your case and what they will quote.
          </p>
          {hospitals.length === 0 ? (
            <p className="mt-6 rounded-lg border bg-secondary/40 p-6 text-muted-foreground">
              We have not published a hospital listing for this treatment yet. Start your case and a
              case manager will approach suitable units directly.
            </p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  doctorCount={
                    doctors.filter((doctor) => doctor.hospital_id === hospital.id).length
                  }
                />
              ))}
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-semibold">Related treatments</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <TreatmentCard key={item.id} treatment={item} />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border bg-primary-subtle/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold">
                Ready to find out what this would cost for you?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Upload your reports and we will get a doctor&apos;s opinion and a written quote.
                Free, and nothing is committed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/sign-in?next=${encodeURIComponent(`/intake?treatment=${slug}`)}`}>
                  Start my case
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Ask a question first</Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Travelling from {countryName("NG")}, {countryName("BD")}, {countryName("AE")} or
            elsewhere? Set your language when you sign up and we will match you with a case manager
            who speaks it.
          </p>
        </section>
      </div>
    </>
  );
}
