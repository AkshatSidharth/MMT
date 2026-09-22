import type { Metadata } from "next";
import Link from "next/link";
import { TreatmentCard } from "@/components/site/cards";
import { IndicativeNote } from "@/components/site/trust";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Treatments",
  description:
    "Cardiac surgery, orthopaedics, oncology, transplants, neurosurgery, fertility and more — with indicative cost bands and the accredited Indian hospitals listed as offering each one.",
};

export default async function TreatmentsPage() {
  const treatments = await db.listTreatments();

  const categories = [...new Set(treatments.map((treatment) => treatment.category))];

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Treatments we arrange</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Each page explains what the procedure involves, how long you would be in India, an
            indicative cost band, and which accredited hospitals are listed as offering it. If your
            treatment is not here, tell us — the catalogue is what we have vetted, not the limit of
            what is possible.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${encodeURIComponent(category)}`}
                className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
              >
                {category}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-12">
        {categories.map((category) => (
          <section key={category} id={encodeURIComponent(category)} className="mb-14 scroll-mt-24">
            <h2 className="text-2xl font-semibold">{category}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {treatments
                .filter((treatment) => treatment.category === category)
                .map((treatment) => (
                  <TreatmentCard key={treatment.id} treatment={treatment} />
                ))}
            </div>
          </section>
        ))}

        <div className="rounded-lg border bg-secondary/40 p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold">Not sure which of these applies to you?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Describe your diagnosis in your own words and upload your reports. A case manager will
            work out the right pathway with the hospital doctors.
          </p>
          <Button asChild className="mt-5">
            <Link href="/sign-in?next=%2Fintake">Start my case</Link>
          </Button>
        </div>

        <IndicativeNote className="mt-8" />
      </div>
    </>
  );
}
