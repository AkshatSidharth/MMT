import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CaseStatusBadge } from "@/components/dashboard/case-stepper";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryName } from "@/lib/reference-data";
import { formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Cases" };

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const admin = await requireAdmin();
  const mine = owner === "mine";

  const cases = await db.listCases(mine ? { assignedAdminId: admin.id } : {});
  const unassigned = cases.filter((item) => !item.assigned_admin_id);

  return (
    <>
      <PageHeader
        title="Cases"
        description="Every case in the system, newest first. Open one to work it."
      >
        <Button asChild variant={mine ? "outline" : "secondary"} size="sm">
          <Link href="/admin/cases">All cases</Link>
        </Button>
        <Button asChild variant={mine ? "secondary" : "outline"} size="sm">
          <Link href="/admin/cases?owner=mine">Assigned to me</Link>
        </Button>
      </PageHeader>

      {!mine && unassigned.length > 0 && (
        <p className="mb-6 rounded-md border border-warning/30 bg-warning-subtle p-4 text-sm text-warning">
          {unassigned.length} case(s) have no case manager. A patient with no named manager has
          nobody to chase the hospital for them.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{mine ? "Your cases" : "All cases"}</CardTitle>
          <CardDescription>{cases.length} case(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {mine ? "No cases are assigned to you yet." : "No cases have been submitted yet."}
            </p>
          ) : (
            <ul className="divide-y">
              {cases.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      <Link href={`/admin/cases/${item.id}`} className="hover:underline">
                        {item.reference} · {item.patient?.full_name ?? "Patient"}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.treatment?.name ?? "Treatment not set"} ·{" "}
                      {countryName(item.home_country)} · submitted {formatDate(item.created_at)} ·
                      updated {relativeTime(item.updated_at)}
                    </p>
                  </div>
                  <CaseStatusBadge status={item.status} />
                  {item.assigned_admin ? (
                    <Badge variant="outline">{item.assigned_admin.full_name}</Badge>
                  ) : (
                    <Badge variant="warning">Unassigned</Badge>
                  )}
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/cases/${item.id}`}>
                      Open
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
