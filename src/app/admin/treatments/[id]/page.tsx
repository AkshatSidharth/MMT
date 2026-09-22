import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TreatmentEditor } from "@/components/admin/treatment-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit treatment" };

export default async function EditTreatmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const treatment = await db.getTreatment(id);
  if (!treatment) notFound();

  return (
    <>
      <PageHeader title={treatment.name} description={treatment.category}>
        <Button asChild variant="outline" size="sm">
          <Link href={`/treatments/${treatment.slug}`} target="_blank">
            View public page
          </Link>
        </Button>
      </PageHeader>
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <TreatmentEditor treatment={treatment} />
        </CardContent>
      </Card>
    </>
  );
}
