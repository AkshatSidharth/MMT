import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DoctorEditor } from "@/components/admin/doctor-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit doctor" };

export default async function EditDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  const [doctor, hospitals] = await Promise.all([db.getDoctor(id), db.listHospitals()]);
  if (!doctor) notFound();

  return (
    <>
      <PageHeader title={doctor.name} description={doctor.specialty} />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <DoctorEditor doctor={doctor} hospitals={hospitals} />
        </CardContent>
      </Card>
    </>
  );
}
