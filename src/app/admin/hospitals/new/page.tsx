import type { Metadata } from "next";
import { HospitalEditor } from "@/components/admin/hospital-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New hospital" };

export default async function NewHospitalPage() {
  await requireAdmin();
  const treatments = await db.listTreatments();

  return (
    <>
      <PageHeader
        title="New hospital"
        description="Add a hospital to the public reference directory."
      />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <HospitalEditor hospital={null} treatments={treatments} />
        </CardContent>
      </Card>
    </>
  );
}
