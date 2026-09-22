import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { HospitalEditor } from "@/components/admin/hospital-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit hospital" };

export default async function EditHospitalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  const [hospital, treatments, doctors] = await Promise.all([
    db.getHospital(id),
    db.listTreatments(),
    db.listDoctors(id),
  ]);
  if (!hospital) notFound();

  return (
    <>
      <PageHeader title={hospital.name} description={`Reference listing · ${hospital.city}`}>
        <Button asChild variant="outline" size="sm">
          <Link href={`/hospitals/${hospital.slug}`} target="_blank">
            View public page
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="pt-6">
            <HospitalEditor hospital={hospital} treatments={treatments} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Doctors</CardTitle>
            <CardDescription>{doctors.length} listed at this hospital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {doctors.map((doctor) => (
                <li key={doctor.id}>
                  <Link href={`/admin/doctors/${doctor.id}`} className="font-medium hover:underline">
                    {doctor.name}
                  </Link>
                  <span className="block text-muted-foreground">{doctor.specialty}</span>
                </li>
              ))}
              {doctors.length === 0 && (
                <li className="text-muted-foreground">No doctors listed yet.</li>
              )}
            </ul>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/doctors/new?hospital=${hospital.id}`}>
                <Plus className="size-4" />
                Add doctor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
