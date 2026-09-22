import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Lock,
  LockOpen,
  MessageCircle,
  Trash2,
} from "lucide-react";
import {
  assignCaseManagerAction,
  deleteCaseDocumentAction,
  removeMatchAction,
  setCaseLockAction,
  setKycStatusAction,
  setMatchStatusAction,
  updateCaseStatusAction,
} from "@/app/actions/admin";
import { AdminMessageComposer } from "@/components/admin/admin-message-composer";
import { CaseDocumentUploader } from "@/components/admin/case-document-uploader";
import { CaseNotes } from "@/components/admin/case-notes";
import { ConsultationForm } from "@/components/admin/consultation-form";
import { MatchPicker } from "@/components/admin/match-picker";
import { QuoteEditor } from "@/components/admin/quote-editor";
import { CaseStatusBadge } from "@/components/dashboard/case-stepper";
import { DocumentList } from "@/components/dashboard/document-list";
import { MessageThread } from "@/components/dashboard/message-thread";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccreditationBadge } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryByCode, countryName } from "@/lib/reference-data";
import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  MATCH_STATUSES,
  MATCH_STATUS_LABELS,
} from "@/lib/types";
import { formatDate, formatUsd } from "@/lib/utils";

export const metadata: Metadata = { title: "Case detail" };

export default async function AdminCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  const medicalCase = await db.getCase(id);
  if (!medicalCase) notFound();

  const [admins, hospitals, messages] = await Promise.all([
    db.listAdmins(),
    db.listHospitals(),
    db.listMessages(id),
  ]);

  const treatmentSlug = medicalCase.treatment?.slug;
  // Hospitals listed as offering this treatment come first when matching.
  const suggested = treatmentSlug
    ? hospitals.filter((hospital) => hospital.treatment_slugs.includes(treatmentSlug))
    : [];
  const others = hospitals.filter((hospital) => !suggested.includes(hospital));
  const matchedIds = new Set(medicalCase.matches.map((match) => match.hospital_id));

  const records = medicalCase.documents.filter((document) => document.type === "medical_record");
  const identity = medicalCase.documents.filter((document) => document.type === "passport");
  const issued = medicalCase.documents.filter((document) =>
    ["quote", "visa_letter", "treatment_plan", "discharge_summary", "other"].includes(document.type),
  );
  const nationality = countryByCode(medicalCase.profile?.nationality);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/pipeline">
          <ArrowLeft className="size-4" />
          Back to pipeline
        </Link>
      </Button>

      <PageHeader
        title={`${medicalCase.reference} · ${medicalCase.patient?.full_name ?? medicalCase.profile?.full_name ?? "Patient"}`}
        description={`${medicalCase.treatment?.name ?? "Treatment not set"} · travelling from ${countryName(medicalCase.home_country)} · submitted ${formatDate(medicalCase.created_at)}`}
      >
        <CaseStatusBadge status={medicalCase.status} />
        {medicalCase.locked && (
          <Badge variant="warning">
            <Lock className="size-3.5" aria-hidden="true" />
            Locked for editing
          </Badge>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stage</CardTitle>
            <CardDescription>Drives the patient&apos;s progress stepper.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCaseStatusAction} className="flex gap-2">
              <input type="hidden" name="case_id" value={medicalCase.id} />
              <Select name="status" defaultValue={medicalCase.status} className="h-10">
                {CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CASE_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="secondary">
                Set
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Case manager</CardTitle>
            <CardDescription>Shown to the patient with contact details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={assignCaseManagerAction} className="flex gap-2">
              <input type="hidden" name="case_id" value={medicalCase.id} />
              <Select
                name="assigned_admin_id"
                defaultValue={medicalCase.assigned_admin_id ?? ""}
                className="h-10"
              >
                <option value="">Unassigned</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name ?? admin.email}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="secondary">
                Assign
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Patient editing</CardTitle>
            <CardDescription>
              Lock once a hospital is working from these details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setCaseLockAction}>
              <input type="hidden" name="case_id" value={medicalCase.id} />
              <input type="hidden" name="locked" value={medicalCase.locked ? "false" : "true"} />
              <Button type="submit" size="sm" variant={medicalCase.locked ? "outline" : "secondary"}>
                {medicalCase.locked ? (
                  <>
                    <LockOpen className="size-4" />
                    Unlock case
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    Lock case
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="size-4" />
            Case & KYC
          </TabsTrigger>
          <TabsTrigger value="match">
            <ClipboardList className="size-4" />
            Match & quote ({medicalCase.matches.length})
          </TabsTrigger>
          <TabsTrigger value="consultation">
            <CalendarClock className="size-4" />
            Consultation
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Building2 className="size-4" />
            Documents ({issued.length})
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="size-4" />
            Messages ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Intake answers</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  {[
                    { label: "Treatment", value: medicalCase.treatment?.name ?? "Not set" },
                    { label: "Patient description", value: medicalCase.diagnosis_text },
                    { label: "Travel window", value: medicalCase.travel_window },
                    {
                      label: "Flexibility",
                      value: medicalCase.travel_flexibility.replace(/_/g, " "),
                    },
                    { label: "Attendants", value: String(medicalCase.attendants_count) },
                    { label: "Travelling from", value: countryName(medicalCase.home_country) },
                    {
                      label: "Contact",
                      value:
                        medicalCase.patient?.email ?? medicalCase.patient?.phone ?? "—",
                    },
                    {
                      label: "Language",
                      value: medicalCase.patient?.language?.toUpperCase() ?? "EN",
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="whitespace-pre-wrap font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>KYC</CardTitle>
                  <CardDescription>
                    Verify by eye against the passport copy, then set the status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name on passport</dt>
                      <dd className="font-medium">{medicalCase.profile?.full_name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Date of birth</dt>
                      <dd className="font-medium">{formatDate(medicalCase.profile?.dob)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nationality</dt>
                      <dd className="font-medium">
                        {countryName(medicalCase.profile?.nationality)}
                        {nationality && (
                          <span className="ms-2 text-xs text-muted-foreground">
                            {nationality.eMedicalVisa
                              ? "e-Medical Visa route"
                              : "check visa route"}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Passport number</dt>
                      <dd className="font-medium">
                        {medicalCase.profile?.passport_number ?? "Not provided"}
                      </dd>
                    </div>
                  </dl>

                  <DocumentList
                    documents={identity}
                    emptyMessage="No passport copy uploaded yet."
                  />

                  <form action={setKycStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="patient_id" value={medicalCase.patient_id} />
                    <input type="hidden" name="case_id" value={medicalCase.id} />
                    <input
                      type="hidden"
                      name="kyc_status"
                      value={medicalCase.profile?.kyc_status === "verified" ? "pending" : "verified"}
                    />
                    <Badge variant={medicalCase.profile?.kyc_status === "verified" ? "success" : "warning"}>
                      {medicalCase.profile?.kyc_status === "verified" ? "Verified" : "Pending"}
                    </Badge>
                    <Button type="submit" size="sm" variant="secondary">
                      <BadgeCheck className="size-4" />
                      {medicalCase.profile?.kyc_status === "verified"
                        ? "Mark as pending"
                        : "Mark as verified"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uploaded medical records</CardTitle>
                  <CardDescription>{records.length} file(s) from the patient.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentList
                    documents={records}
                    emptyMessage="No medical records yet. Chase the patient in Messages."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Internal notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <CaseNotes caseId={medicalCase.id} notes={medicalCase.admin_notes} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="match">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Match a hospital to this case</CardTitle>
              <CardDescription>
                Matching is a judgement call, not an algorithm. Hospitals listed as offering{" "}
                {medicalCase.treatment?.name ?? "this treatment"} are grouped first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchPicker
                caseId={medicalCase.id}
                suggested={suggested}
                others={others}
                matchedIds={[...matchedIds]}
              />
            </CardContent>
          </Card>

          {medicalCase.matches.length === 0 ? (
            <p className="text-muted-foreground">
              No hospitals matched yet. Adding the first match moves the case to “Hospitals
              matched”.
            </p>
          ) : (
            <div className="space-y-6">
              {medicalCase.matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle>{match.hospital?.name ?? "Hospital"}</CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                          {match.hospital?.city}
                          {match.hospital?.accreditation.map((code) => (
                            <AccreditationBadge key={code} code={code} />
                          ))}
                        </CardDescription>
                        {match.hospital?.intl_desk_contact && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            International desk: {match.hospital.intl_desk_contact}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {match.quote_amount !== null && (
                          <Badge variant="success">{formatUsd(match.quote_amount)}</Badge>
                        )}
                        <form action={setMatchStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="case_id" value={medicalCase.id} />
                          <input type="hidden" name="match_id" value={match.id} />
                          <Select
                            name="status"
                            defaultValue={match.status}
                            className="h-9 w-[220px] text-sm"
                          >
                            {MATCH_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {MATCH_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm" variant="secondary">
                            Set
                          </Button>
                        </form>
                        <form action={removeMatchAction}>
                          <input type="hidden" name="case_id" value={medicalCase.id} />
                          <input type="hidden" name="match_id" value={match.id} />
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            aria-label={`Remove ${match.hospital?.name ?? "hospital"} from this case`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <QuoteEditor
                      caseId={medicalCase.id}
                      matchId={match.id}
                      hospitalName={match.hospital?.name ?? "this hospital"}
                      initialLines={match.quote_breakdown}
                      initialDetails={match.quote_details}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consultation">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Teleconsultation</CardTitle>
              <CardDescription>
                Arrange the call with the hospital by phone or email, then publish the details here.
                The patient sees exactly what you enter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsultationForm
                caseId={medicalCase.id}
                consultation={medicalCase.consultation}
                hospitals={hospitals}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Issue a document</CardTitle>
                <CardDescription>
                  Uploading publishes it straight to the patient&apos;s Documents page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseDocumentUploader caseId={medicalCase.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issued to this patient</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList documents={issued} emptyMessage="Nothing issued yet." />
                {issued.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    {issued.map((document) => (
                      <form
                        key={document.id}
                        action={deleteCaseDocumentAction}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <input type="hidden" name="case_id" value={medicalCase.id} />
                        <input type="hidden" name="document_id" value={document.id} />
                        <span className="truncate text-muted-foreground">{document.title}</span>
                        <Button type="submit" size="sm" variant="ghost">
                          <Trash2 className="size-4" />
                          Withdraw
                        </Button>
                      </form>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Conversation with the patient</CardTitle>
              <CardDescription>
                The primary channel. Everything here is visible to the patient.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MessageThread
                messages={messages}
                viewerRole="admin"
                emptyMessage="No messages yet. Introduce yourself and tell the patient what happens next."
              />
              <div className="border-t pt-6">
                <AdminMessageComposer caseId={medicalCase.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
