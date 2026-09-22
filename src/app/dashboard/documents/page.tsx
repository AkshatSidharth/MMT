import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { DocumentList } from "@/components/dashboard/document-list";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivacyNote } from "@/components/site/trust";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Documents" };

const GROUPS = [
  {
    title: "From your case manager",
    description: "Quotes, visa invitation letters, treatment plans and discharge summaries.",
    types: ["quote", "visa_letter", "treatment_plan", "discharge_summary"],
  },
  {
    title: "Your uploads",
    description: "Medical records and identity documents you have shared with us.",
    types: ["medical_record", "passport", "other"],
  },
];

export default async function DocumentsPage() {
  const user = await requirePatient();
  const [documents, cases] = await Promise.all([
    db.listDocuments({ patientId: user.id }),
    db.listCasesByPatient(user.id),
  ]);

  if (cases.length === 0 && documents.length === 0) {
    return (
      <>
        <PageHeader title="Documents" />
        <NoCaseYet context="Your quote, visa letter and treatment plan will be filed here once your case is under way." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description="Everything issued for your treatment, in one place. Links are private and expire shortly after you open this page."
      />

      <div className="space-y-6">
        {GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
                {group.title}
              </CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={documents.filter((document) => group.types.includes(document.type))}
                allowDelete={group.title === "Your uploads"}
                emptyMessage={
                  group.title === "Your uploads"
                    ? "You have not uploaded anything yet. Add your reports from the My Case page."
                    : "Nothing issued yet. Your quote and travel paperwork will appear here."
                }
              />
            </CardContent>
          </Card>
        ))}

        <PrivacyNote />
      </div>
    </>
  );
}
