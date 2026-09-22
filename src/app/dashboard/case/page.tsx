import type { Metadata } from "next";
import { CaseEditor } from "@/components/dashboard/case-editor";
import { DocumentList } from "@/components/dashboard/document-list";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { RecordUploader } from "@/components/dashboard/record-uploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivacyNote } from "@/components/site/trust";
import { getActiveCase } from "@/app/actions/cases";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryName } from "@/lib/reference-data";
import { CASE_STATUS_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My medical case" };

export default async function MyCasePage() {
  const user = await requirePatient();
  const activeCase = await getActiveCase(user.id);
  if (!activeCase) {
    return (
      <>
        <PageHeader title="My medical case" />
        <NoCaseYet />
      </>
    );
  }

  const treatments = await db.listTreatments();
  const records = activeCase.documents.filter((document) => document.type === "medical_record");

  return (
    <>
      <PageHeader
        title="My medical case"
        description={`Case ${activeCase.reference} · ${CASE_STATUS_LABELS[activeCase.status]} · submitted ${formatDate(activeCase.created_at)}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Case summary</CardTitle>
            <CardDescription>
              Keep this accurate — it is what the hospital doctors read.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Travelling from</dt>
                <dd className="font-medium">{countryName(activeCase.home_country)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Travel window</dt>
                <dd className="font-medium">{activeCase.travel_window}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Attendants</dt>
                <dd className="font-medium">{activeCase.attendants_count}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Case manager</dt>
                <dd className="font-medium">
                  {activeCase.assigned_admin?.full_name ?? "Being assigned"}
                </dd>
              </div>
            </dl>
            <CaseEditor
              medicalCase={activeCase}
              treatments={treatments}
              currentTreatmentSlug={activeCase.treatment?.slug ?? ""}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical records</CardTitle>
              <CardDescription>
                {records.length > 0
                  ? `${records.length} file(s) attached to your case.`
                  : "No reports attached yet. Adding them is the fastest way to get a doctor's opinion."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RecordUploader caseId={activeCase.id} />
              <DocumentList
                documents={records}
                allowDelete={!activeCase.locked}
                emptyMessage="No medical records uploaded yet."
              />
              <PrivacyNote />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
