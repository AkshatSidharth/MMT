import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { deleteHospitalAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccreditationBadge } from "@/components/site/trust";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Hospitals" };

export default async function AdminHospitalsPage() {
  await requireAdmin();
  const [hospitals, doctors] = await Promise.all([db.listHospitals(), db.listDoctors()]);

  return (
    <>
      <PageHeader
        title="Hospitals"
        description="The reference directory shown on the public site. Compile it from published, verifiable sources — everything here is displayed as indicative, not as bookable inventory."
      >
        <Button asChild>
          <Link href="/admin/hospitals/new">
            <Plus className="size-4" />
            New hospital
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{hospitals.length} hospital(s)</CardTitle>
          <CardDescription>
            Removing a hospital also removes its doctors and any case matches pointing at it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {hospitals.map((hospital) => (
              <li key={hospital.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <Link href={`/admin/hospitals/${hospital.id}`} className="hover:underline">
                      {hospital.name}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hospital.city} · {hospital.specialties.length} specialties ·{" "}
                    {doctors.filter((doctor) => doctor.hospital_id === hospital.id).length} doctors ·{" "}
                    {hospital.treatment_slugs.length} treatments
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {hospital.accreditation.map((code) => (
                    <AccreditationBadge key={code} code={code} />
                  ))}
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/hospitals/${hospital.slug}`} target="_blank">
                    <ExternalLink className="size-4" />
                    <span className="sr-only">View public page for {hospital.name}</span>
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/admin/hospitals/${hospital.id}`}>Edit</Link>
                </Button>
                <form action={deleteHospitalAction}>
                  <input type="hidden" name="id" value={hospital.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
