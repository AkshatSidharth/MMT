import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BedDouble, Building2, CheckCircle2, MapPin } from "lucide-react";
import { TreatmentCard } from "@/components/site/cards";
import { AccreditationBadge, IndicativeNote } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatUsdBand } from "@/lib/utils";

export async function generateStaticParams() {
  const hospitals = await db.listHospitals();
  return hospitals.map((hospital) => ({ slug: hospital.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hospital = await db.getHospitalBySlug(slug);
  if (!hospital) return { title: "Hospital not found" };
  return {
    title: `${hospital.name}, ${hospital.city}`,
    description: `${hospital.name} in ${hospital.city} — ${hospital.accreditation.join(", ")} accredited. Specialties, doctors, facilities for international patients and indicative treatment packages.`,
  };
}

export default async function HospitalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hospital = await db.getHospitalBySlug(slug);
  if (!hospital) notFound();

  const [doctors, treatments] = await Promise.all([
    db.listDoctors(hospital.id),
    db.listTreatments(),
  ]);

  const offered = treatments.filter((treatment) =>
    hospital.treatment_slugs.includes(treatment.slug),
  );

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {hospital.accreditation.map((code) => (
                <AccreditationBadge key={code} code={code} />
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{hospital.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {hospital.city}
              </span>
              {hospital.beds && (
                <span className="flex items-center gap-1.5">
                  <BedDouble className="size-4" aria-hidden="true" />
                  {hospital.beds} beds
                </span>
              )}
              {hospital.established_year && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" aria-hidden="true" />
                  Established {hospital.established_year}
                </span>
              )}
            </p>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{hospital.about}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {hospital.specialties.map((specialty) => (
                <li key={specialty}>
                  <Badge variant="secondary">{specialty}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request a consultation here</CardTitle>
              <CardDescription>
                Tell us your case and we will approach this hospital&apos;s international desk on
                your behalf.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full">
                <Link href={`/sign-in?next=${encodeURIComponent("/intake")}`}>
                  Request consultation at this hospital
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/cost-estimator">Get a cost estimate first</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                There is no direct booking. A case manager checks that this hospital genuinely suits
                your case, confirms availability with them, and comes back to you with a quote.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="container py-12">
        {hospital.facilities.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-semibold">Facilities for international patients</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hospital.facilities.map((facility) => (
                <li key={facility} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                  <span>{facility}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-14">
          <h2 className="text-2xl font-semibold">Doctors</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Senior consultants listed at this hospital. Doctors do not hold accounts on this
            platform and there are no public calendars — your consultation is arranged by your case
            manager with the hospital.
          </p>
          {doctors.length === 0 ? (
            <p className="mt-6 rounded-lg border bg-secondary/40 p-6 text-muted-foreground">
              We have not published doctor profiles for this hospital yet.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <li key={doctor.id} className="rounded-lg border bg-card p-5">
                  <p className="font-semibold">{doctor.name}</p>
                  <p className="text-sm text-primary">{doctor.specialty}</p>
                  {doctor.qualifications && (
                    <p className="mt-2 text-sm text-muted-foreground">{doctor.qualifications}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doctor.years_experience} years of experience
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold">Indicative treatment packages</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Treatments this hospital is listed as offering, with the indicative cost band for India.
            A hospital-specific figure comes with your quote.
          </p>
          {offered.length === 0 ? (
            <p className="mt-6 rounded-lg border bg-secondary/40 p-6 text-muted-foreground">
              No treatment packages published for this hospital yet.
            </p>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-secondary/60">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">Treatment</th>
                      <th className="px-4 py-3 text-start font-medium">Category</th>
                      <th className="px-4 py-3 text-start font-medium">Indicative band</th>
                      <th className="px-4 py-3 text-end font-medium">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {offered.map((treatment) => (
                      <tr key={treatment.id}>
                        <td className="px-4 py-3 font-medium">{treatment.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{treatment.category}</td>
                        <td className="px-4 py-3 text-primary">
                          {formatUsdBand(
                            treatment.indicative_cost_min,
                            treatment.indicative_cost_max,
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Link
                            href={`/treatments/${treatment.slug}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <IndicativeNote className="mt-4" />
            </>
          )}
        </section>

        {offered.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold">Popular here</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offered.slice(0, 3).map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
