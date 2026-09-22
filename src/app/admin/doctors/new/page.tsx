import type { Metadata } from "next";
import { DoctorEditor } from "@/components/admin/doctor-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New doctor" };

export default async function NewDoctorPage({
  searchParams,
}: {
  searchParams: Promise<{ hospital?: string }>;
}) {
  const { hospital } = await searchParams;
  await requireAdmin();
  const hospitals = await db.listHospitals();

  return (
    <>
      <PageHeader title="New doctor" description="Add a doctor to a hospital's public listing." />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <DoctorEditor doctor={null} hospitals={hospitals} defaultHospitalId={hospital} />
        </CardContent>
      </Card>
    </>
  );
}
