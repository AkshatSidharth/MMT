import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCheck2, FileWarning, Inbox, Users } from "lucide-react";
import { updateLeadAction } from "@/app/actions/admin";
import { CaseStatusBadge } from "@/components/dashboard/case-stepper";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryName } from "@/lib/reference-data";
import { CASE_STATUSES, CASE_STATUS_LABELS, LEAD_STAGES, type CaseStatus } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  await requireAdmin();

  const statusFilter = (CASE_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as CaseStatus)
    : undefined;

  const [cases, allCases, leads] = await Promise.all([
    db.listCases({ status: statusFilter, query: q }),
    db.listCases(),
    db.listLeads(),
  ]);

  const counts = CASE_STATUSES.map((step) => ({
    step,
    count: allCases.filter((item) => item.status === step).length,
  }));
  const newLeads = leads.filter((lead) => lead.stage === "new").length;
  const missingRecords = allCases.filter(
    (item) => !item.documents.some((document) => document.type === "medical_record"),
  ).length;

  return (
    <>
      <PageHeader
        title="Lead & case pipeline"
        description="Every enquiry and every open case. Fulfilment is manual: pick up a case, work the hospitals offline, then publish the result here."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open cases", value: allCases.length, icon: Users },
          { label: "New leads", value: newLeads, icon: Inbox },
          { label: "Awaiting records", value: missingRecords, icon: FileWarning },
          {
            label: "Quotes published",
            value: allCases.filter((item) =>
              item.matches.some((match) => match.quote_amount !== null),
            ).length,
            icon: FileCheck2,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <stat.icon className="size-8 text-primary" aria-hidden="true" />
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>
            Click a case to open the full record: intake answers, uploaded reports, KYC documents,
            matching, quote, consultation and the message thread.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-5 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Reference, patient, treatment"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm"
              />
            </div>
            <div className="min-w-[200px]">
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                Stage
              </label>
              <Select id="status" name="status" defaultValue={statusFilter ?? ""}>
                <option value="">All stages</option>
                {counts.map((item) => (
                  <option key={item.step} value={item.step}>
                    {CASE_STATUS_LABELS[item.step]} ({item.count})
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            {(statusFilter || q) && (
              <Button asChild variant="ghost">
                <Link href="/admin/pipeline">Clear</Link>
              </Button>
            )}
          </form>

          {cases.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No cases match this filter yet.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pe-4 text-start font-medium">Reference</th>
                    <th className="py-3 pe-4 text-start font-medium">Patient</th>
                    <th className="py-3 pe-4 text-start font-medium">Treatment</th>
                    <th className="py-3 pe-4 text-start font-medium">Country</th>
                    <th className="py-3 pe-4 text-start font-medium">Stage</th>
                    <th className="py-3 pe-4 text-start font-medium">Records</th>
                    <th className="py-3 pe-4 text-start font-medium">Manager</th>
                    <th className="py-3 pe-4 text-start font-medium">Submitted</th>
                    <th className="py-3 text-end font-medium">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cases.map((item) => {
                    const hasRecords = item.documents.some(
                      (document) => document.type === "medical_record",
                    );
                    return (
                      <tr key={item.id} className="hover:bg-accent/40">
                        <td className="py-3 pe-4 font-medium">
                          <Link href={`/admin/cases/${item.id}`} className="hover:underline">
                            {item.reference}
                          </Link>
                        </td>
                        <td className="py-3 pe-4">
                          {item.patient?.full_name ?? item.profile?.full_name ?? "—"}
                          <span className="block text-xs text-muted-foreground">
                            {item.patient?.email ?? item.patient?.phone ?? ""}
                          </span>
                        </td>
                        <td className="py-3 pe-4">{item.treatment?.name ?? "Not set"}</td>
                        <td className="py-3 pe-4">{countryName(item.home_country)}</td>
                        <td className="py-3 pe-4">
                          <CaseStatusBadge status={item.status} />
                        </td>
                        <td className="py-3 pe-4">
                          {hasRecords ? (
                            <Badge variant="success">Uploaded</Badge>
                          ) : (
                            <Badge variant="warning">Missing</Badge>
                          )}
                        </td>
                        <td className="py-3 pe-4">
                          {item.assigned_admin?.full_name ?? (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pe-4 text-muted-foreground">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="py-3 text-end">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/cases/${item.id}`}>
                              Open
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Captured from the cost estimator and the contact form, before the visitor has signed up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No leads captured yet.</p>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 pe-4 text-start font-medium">Name</th>
                    <th className="py-3 pe-4 text-start font-medium">Contact</th>
                    <th className="py-3 pe-4 text-start font-medium">Interest</th>
                    <th className="py-3 pe-4 text-start font-medium">Country</th>
                    <th className="py-3 pe-4 text-start font-medium">Source</th>
                    <th className="py-3 pe-4 text-start font-medium">Received</th>
                    <th className="py-3 text-start font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="py-3 pe-4 font-medium">{lead.name}</td>
                      <td className="py-3 pe-4">
                        <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                          {lead.email}
                        </a>
                        <span className="block text-xs text-muted-foreground">{lead.phone}</span>
                      </td>
                      <td className="py-3 pe-4">{lead.treatment_interest ?? "—"}</td>
                      <td className="py-3 pe-4">{countryName(lead.country)}</td>
                      <td className="py-3 pe-4 text-muted-foreground">
                        {lead.source.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 pe-4 text-muted-foreground">
                        {relativeTime(lead.created_at)}
                      </td>
                      <td className="py-3">
                        <form action={updateLeadAction} className="flex items-center gap-2">
                          <input type="hidden" name="lead_id" value={lead.id} />
                          <Select
                            name="stage"
                            defaultValue={lead.stage}
                            className="h-9 w-[150px] text-sm"
                          >
                            {LEAD_STAGES.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage.charAt(0).toUpperCase() + stage.slice(1)}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm" variant="secondary">
                            Save
                          </Button>
                        </form>
                        {lead.notes && (
                          <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                            {lead.notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
