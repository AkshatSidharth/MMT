import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageCircle,
  Phone,
  Upload,
  Video,
} from "lucide-react";
import { CaseStepper } from "@/components/dashboard/case-stepper";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCase } from "@/app/actions/cases";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryName } from "@/lib/reference-data";
import { CASE_NEXT_STEP, CASE_STATUS_LABELS } from "@/lib/types";
import { formatDate, formatDateTime, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const user = await requirePatient();
  const activeCase = await getActiveCase(user.id);

  if (!activeCase) {
    return (
      <>
        <PageHeader title={`Welcome${user.full_name ? `, ${user.full_name}` : ""}`} />
        <NoCaseYet />
      </>
    );
  }

  const messages = await db.listMessages(activeCase.id);
  const lastMessage = messages.at(-1);
  const quotedMatches = activeCase.matches.filter((match) => match.quote_amount !== null);
  const manager = activeCase.assigned_admin;

  return (
    <>
      <PageHeader
        title={`Your case ${activeCase.reference}`}
        description={`${activeCase.treatment?.name ?? "Treatment to be confirmed"} · travelling from ${countryName(activeCase.home_country)} · submitted ${formatDate(activeCase.created_at)}`}
      >
        <Badge variant="default">{CASE_STATUS_LABELS[activeCase.status]}</Badge>
      </PageHeader>

      {submitted && (
        <p className="mb-6 flex items-start gap-2 rounded-md border border-success/25 bg-success-subtle p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Your case has been submitted.</strong> A case manager
            will be assigned and will review your records. You will see progress here, and we will
            message you on this dashboard.
          </span>
        </p>
      )}

      <Card className="mb-6 border-primary/25 bg-primary-subtle/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ArrowRight className="size-5" aria-hidden="true" />
            Your next step
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{CASE_NEXT_STEP[activeCase.status]}</p>
          <div className="flex flex-wrap gap-2">
            {activeCase.documents.filter((document) => document.type === "medical_record").length ===
              0 && (
              <Button asChild size="sm">
                <Link href="/dashboard/case">
                  <Upload className="size-4" />
                  Add your medical reports
                </Link>
              </Button>
            )}
            {activeCase.status === "consultation_scheduled" && activeCase.consultation && (
              <Button asChild size="sm">
                <Link href="/dashboard/consultation">
                  <Video className="size-4" />
                  View consultation details
                </Link>
              </Button>
            )}
            {quotedMatches.length > 0 && (
              <Button asChild size="sm">
                <Link href="/dashboard/quotes">
                  <ClipboardList className="size-4" />
                  Review your quote
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/messages">
                <MessageCircle className="size-4" />
                Message my case manager
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Case progress</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseStepper status={activeCase.status} />
            <p className="mt-6 text-sm text-muted-foreground">
              Stages move forward when your case manager completes each step offline with the
              hospital. Last updated {formatDateTime(activeCase.updated_at)}.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your case manager</CardTitle>
            </CardHeader>
            <CardContent>
              {manager ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-11 items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary"
                    >
                      {initials(manager.full_name ?? "Case manager")}
                    </span>
                    <div>
                      <p className="font-medium">{manager.full_name}</p>
                      <p className="text-sm text-muted-foreground">Case manager</p>
                    </div>
                  </div>
                  {manager.email && (
                    <p className="text-sm text-muted-foreground break-all">{manager.email}</p>
                  )}
                  {manager.phone && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="size-4" aria-hidden="true" />
                      {manager.phone}
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/dashboard/messages">
                      <MessageCircle className="size-4" />
                      Send a message
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  We are assigning a case manager who speaks your language. You can still send a
                  message and the first available manager will pick it up.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { href: "/dashboard/case", label: "My medical case", icon: FileText },
                {
                  href: "/dashboard/quotes",
                  label: `Hospitals & quotes${activeCase.matches.length ? ` (${activeCase.matches.length})` : ""}`,
                  icon: ClipboardList,
                },
                { href: "/dashboard/documents", label: "Documents", icon: FileText },
                {
                  href: "/dashboard/messages",
                  label: `Messages${messages.length ? ` (${messages.length})` : ""}`,
                  icon: MessageCircle,
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-accent"
                >
                  <link.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {link.label}
                  <ArrowRight className="ms-auto size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {lastMessage && (
            <Card>
              <CardHeader>
                <CardTitle>Latest message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{lastMessage.sender_name}</p>
                <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                  {lastMessage.body}
                </p>
                <Link
                  href="/dashboard/messages"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open conversation
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
