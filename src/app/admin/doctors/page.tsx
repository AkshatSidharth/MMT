import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteDoctorAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Doctors" };

export default async function AdminDoctorsPage() {
  await requireAdmin();
  const [doctors, hospitals] = await Promise.all([db.listDoctors(), db.listHospitals()]);
  const hospitalName = (id: string) => hospitals.find((item) => item.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Doctor profiles shown on the hospital pages. Names, specialties and qualifications only — no calendars and no doctor logins."
      >
        <Button asChild>
          <Link href="/admin/doctors/new">
            <Plus className="size-4" />
            New doctor
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{doctors.length} doctor(s)</CardTitle>
          <CardDescription>Grouped by the hospital they practise at.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <Link href={`/admin/doctors/${doctor.id}`} className="hover:underline">
                      {doctor.name}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialty} · {doctor.years_experience} years ·{" "}
                    {hospitalName(doctor.hospital_id)}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/admin/doctors/${doctor.id}`}>Edit</Link>
                </Button>
                <form action={deleteDoctorAction}>
                  <input type="hidden" name="id" value={doctor.id} />
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
