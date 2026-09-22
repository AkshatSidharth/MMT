import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { deleteTreatmentAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsdBand } from "@/lib/utils";

export const metadata: Metadata = { title: "Treatments" };

export default async function AdminTreatmentsPage() {
  await requireAdmin();
  const [treatments, hospitals] = await Promise.all([db.listTreatments(), db.listHospitals()]);

  return (
    <>
      <PageHeader
        title="Treatments"
        description="The treatment catalogue and its indicative cost bands. This drives the intake dropdown, the treatment pages and the cost estimator."
      >
        <Button asChild>
          <Link href="/admin/treatments/new">
            <Plus className="size-4" />
            New treatment
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{treatments.length} treatment(s)</CardTitle>
          <CardDescription>
            Deleting a treatment leaves existing cases intact but clears their treatment field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {treatments.map((treatment) => {
              const offering = hospitals.filter((hospital) =>
                hospital.treatment_slugs.includes(treatment.slug),
              ).length;
              return (
                <li key={treatment.id} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      <Link href={`/admin/treatments/${treatment.id}`} className="hover:underline">
                        {treatment.name}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {treatment.category} ·{" "}
                      {formatUsdBand(treatment.indicative_cost_min, treatment.indicative_cost_max)}{" "}
                      · offered at {offering} hospital(s)
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/treatments/${treatment.slug}`} target="_blank">
                      <ExternalLink className="size-4" />
                      <span className="sr-only">View public page for {treatment.name}</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/treatments/${treatment.id}`}>Edit</Link>
                  </Button>
                  <form action={deleteTreatmentAction}>
                    <input type="hidden" name="id" value={treatment.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
