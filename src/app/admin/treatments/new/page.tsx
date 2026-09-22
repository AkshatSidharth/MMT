import type { Metadata } from "next";
import { TreatmentEditor } from "@/components/admin/treatment-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New treatment" };

export default async function NewTreatmentPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New treatment"
        description="Add a treatment to the catalogue with its indicative cost band."
      />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <TreatmentEditor treatment={null} />
        </CardContent>
      </Card>
    </>
  );
}
