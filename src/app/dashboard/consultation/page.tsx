import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, ExternalLink, Info, Video } from "lucide-react";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCase } from "@/app/actions/cases";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultation" };

export default async function ConsultationPage() {
  const user = await requirePatient();
  const activeCase = await getActiveCase(user.id);
  if (!activeCase) {
    return (
      <>
        <PageHeader title="Consultation" />
        <NoCaseYet />
      </>
    );
  }

  const consultation = activeCase.consultation;
  const hospital = consultation?.hospital_id
    ? await db.getHospital(consultation.hospital_id)
    : null;
  const scheduledAt = consultation ? new Date(consultation.scheduled_at) : null;
  const isPast = scheduledAt ? scheduledAt.getTime() < Date.now() : false;

  return (
    <>
      <PageHeader
        title="Consultation"
        description="Your teleconsultation with the treating doctor, arranged by your case manager."
      />

      {!consultation ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarClock className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold">
              We&apos;re arranging your consultation
            </p>
            <p className="mx-auto mt-1 max-w-md text-muted-foreground">
              Your case manager will confirm shortly. Once a doctor and time are agreed, the date
              and joining link will appear on this page and we will message you.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/dashboard/messages">Ask about timing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="size-5 text-primary" aria-hidden="true" />
                {isPast ? "Your consultation" : "Your consultation is scheduled"}
              </CardTitle>
              <CardDescription>
                {isPast
                  ? "This consultation has taken place. Your case manager will follow up with the doctor's opinion."
                  : "Join a few minutes early and keep your reports to hand."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Date and time</dt>
                  <dd className="text-lg font-semibold">
                    {formatDateTime(consultation.scheduled_at)}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    Shown in your device&apos;s time zone.
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Doctor</dt>
                  <dd className="text-lg font-semibold">{consultation.doctor_name || "To be confirmed"}</dd>
                  {hospital && (
                    <dd className="text-sm text-muted-foreground">
                      <Link href={`/hospitals/${hospital.slug}`} className="hover:underline">
                        {hospital.name}, {hospital.city}
                      </Link>
                    </dd>
                  )}
                </div>
              </dl>

              {consultation.join_link && !isPast && (
                <Button asChild size="lg">
                  <a href={consultation.join_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Join the consultation
                  </a>
                </Button>
              )}

              {consultation.notes && (
                <div className="rounded-md bg-secondary p-4">
                  <p className="text-sm font-medium">From your case manager</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {consultation.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How the call works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Most calls run 15 to 30 minutes.
              </p>
              <p className="flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                An interpreter can join if you prefer. Ask your case manager in Messages.
              </p>
              <p className="flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                The doctor may ask for an extra test before giving a firm plan. That is normal and
                we will arrange it.
              </p>
              <p>
                Need to reschedule? Message your case manager — there is no automatic booking on
                this platform, a person handles it.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
