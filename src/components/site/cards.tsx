import Link from "next/link";
import { ArrowRight, BedDouble, Building2, MapPin, Stethoscope } from "lucide-react";
import { AccreditationBadge } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsdBand } from "@/lib/utils";
import type { Hospital, Treatment } from "@/lib/types";

export function TreatmentCard({ treatment }: { treatment: Treatment }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <Badge variant="outline" className="w-fit">
          {treatment.category}
        </Badge>
        <CardTitle className="mt-2">
          <Link href={`/treatments/${treatment.slug}`} className="hover:text-primary">
            {treatment.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm text-muted-foreground">{treatment.description}</p>
        <div className="mt-4 border-t pt-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Indicative in India
          </p>
          <p className="text-lg font-semibold text-primary">
            {formatUsdBand(treatment.indicative_cost_min, treatment.indicative_cost_max)}
          </p>
        </div>
        <Link
          href={`/treatments/${treatment.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          See details and hospitals
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function HospitalCard({
  hospital,
  doctorCount,
}: {
  hospital: Hospital;
  doctorCount?: number;
}) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {hospital.accreditation.map((code) => (
            <AccreditationBadge key={code} code={code} />
          ))}
        </div>
        <CardTitle className="mt-2">
          <Link href={`/hospitals/${hospital.slug}`} className="hover:text-primary">
            {hospital.name}
          </Link>
        </CardTitle>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden="true" />
          {hospital.city}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="flex flex-wrap gap-1.5">
          {hospital.specialties.slice(0, 4).map((specialty) => (
            <li key={specialty}>
              <Badge variant="secondary">{specialty}</Badge>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {hospital.beds && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden="true" />
              <dt className="sr-only">Beds</dt>
              <dd>{hospital.beds} beds</dd>
            </div>
          )}
          {doctorCount !== undefined && (
            <div className="flex items-center gap-1.5">
              <Stethoscope className="size-4" aria-hidden="true" />
              <dt className="sr-only">Doctors listed</dt>
              <dd>{doctorCount} doctors listed</dd>
            </div>
          )}
          {hospital.established_year && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4" aria-hidden="true" />
              <dt className="sr-only">Established</dt>
              <dd>Since {hospital.established_year}</dd>
            </div>
          )}
        </dl>

        <Link
          href={`/hospitals/${hospital.slug}`}
          className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View details
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
