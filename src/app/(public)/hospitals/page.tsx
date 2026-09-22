import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { HospitalCard } from "@/components/site/cards";
import { IndicativeNote } from "@/components/site/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Hospital directory",
  description:
    "Search accredited Indian hospitals by city, specialty and accreditation. Reference listings compiled from published sources, shown as indicative.",
};

const ACCREDITATIONS = ["NABH", "JCI", "NABL", "ISO"];

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; specialty?: string; accreditation?: string; q?: string }>;
}) {
  const filters = await searchParams;
  const [hospitals, allHospitals, doctors] = await Promise.all([
    db.listHospitals({
      city: filters.city,
      specialty: filters.specialty,
      accreditation: filters.accreditation,
      query: filters.q,
    }),
    db.listHospitals(),
    db.listDoctors(),
  ]);

  const cities = [...new Set(allHospitals.map((hospital) => hospital.city))].sort();
  const specialties = [
    ...new Set(allHospitals.flatMap((hospital) => hospital.specialties)),
  ].sort();
  const hasFilters = Boolean(
    filters.city || filters.specialty || filters.accreditation || filters.q,
  );

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Hospital directory</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {allHospitals.length} accredited hospitals across India, with their specialties,
            accreditation and listed doctors. This is reference material compiled from published
            sources — it is not live availability, and nothing here is bookable directly. Your case
            manager confirms the hospital with you.
          </p>
        </div>
      </section>

      <div className="container py-10">
        <form className="mb-10 grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Hospital name or city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select id="city" name="city" defaultValue={filters.city ?? ""}>
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Select id="specialty" name="specialty" defaultValue={filters.specialty ?? ""}>
              <option value="">All specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accreditation">Accreditation</Label>
            <Select
              id="accreditation"
              name="accreditation"
              defaultValue={filters.accreditation ?? ""}
            >
              <option value="">Any</option>
              {ACCREDITATIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 md:col-span-5">
            <Button type="submit">
              <Search className="size-4" aria-hidden="true" />
              Apply filters
            </Button>
            {hasFilters && (
              <Button asChild variant="ghost">
                <Link href="/hospitals">Clear all</Link>
              </Button>
            )}
          </div>
        </form>

        <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
          Showing {hospitals.length} of {allHospitals.length} hospitals
        </p>

        {hospitals.length === 0 ? (
          <div className="rounded-lg border bg-secondary/40 p-6 text-center sm:p-8">
            <p className="text-lg font-semibold">No hospitals match those filters</p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Try widening your search. Or tell us your case and we will look beyond the published
              directory for a unit that fits.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/hospitals">Clear filters</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-in?next=%2Fintake">Start my case</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                doctorCount={doctors.filter((doctor) => doctor.hospital_id === hospital.id).length}
              />
            ))}
          </div>
        )}

        <IndicativeNote className="mt-10">
          Hospital details, specialties and doctor lists are compiled from public sources and
          reviewed by our team. They are shown as indicative reference information, not as live
          bookable inventory or a recommendation of one hospital over another.
        </IndicativeNote>
      </div>
    </>
  );
}
