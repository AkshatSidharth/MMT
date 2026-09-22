import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { respondToMatchAction } from "@/app/actions/cases";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccreditationBadge, IndicativeNote } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getActiveCase } from "@/app/actions/cases";
import { requirePatient } from "@/lib/auth";
import { MATCH_STATUS_LABELS } from "@/lib/types";
import { formatUsd } from "@/lib/utils";

export const metadata: Metadata = { title: "Hospitals & quotes" };

export default async function QuotesPage() {
  const user = await requirePatient();
  const activeCase = await getActiveCase(user.id);
  if (!activeCase) {
    return (
      <>
        <PageHeader title="Hospitals & quotes" />
        <NoCaseYet />
      </>
    );
  }

  const { matches } = activeCase;

  return (
    <>
      <PageHeader
        title="Hospitals & quotes"
        description="Hospitals your case manager has shortlisted for your case, with the quotes they have received so far."
      />

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold">No hospitals matched yet</p>
            <p className="mx-auto mt-1 max-w-md text-muted-foreground">
              Your case manager is reading your records and approaching suitable hospitals. Matched
              hospitals and their quotes will appear here — usually within two to three working
              days of your records being complete.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/hospitals">Browse the hospital directory meanwhile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{match.hospital?.name ?? "Hospital"}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      {match.hospital && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {match.hospital.city}
                        </span>
                      )}
                      {match.hospital?.accreditation.map((code) => (
                        <AccreditationBadge key={code} code={code} />
                      ))}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      match.status === "patient_interested" || match.status === "confirmed"
                        ? "success"
                        : match.status === "declined"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {MATCH_STATUS_LABELS[match.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {match.quote_amount === null ? (
                  <p className="rounded-md bg-secondary p-4 text-sm text-muted-foreground">
                    {match.quote_details ??
                      "We have sent your case to this hospital and are waiting for their package price."}
                  </p>
                ) : (
                  <>
                    <div className="rounded-lg border bg-secondary/40 p-5">
                      <p className="text-sm text-muted-foreground">Consolidated quote</p>
                      <p className="text-3xl font-semibold text-primary">
                        {formatUsd(match.quote_amount)}
                      </p>
                      {match.quote_breakdown.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <dl className="space-y-2 text-sm">
                            {match.quote_breakdown.map((line) => (
                              <div key={line.label} className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">{line.label}</dt>
                                <dd className="font-medium">{formatUsd(line.amount)}</dd>
                              </div>
                            ))}
                          </dl>
                        </>
                      )}
                    </div>

                    {match.quote_details && (
                      <div>
                        <p className="text-sm font-medium">What this covers</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {match.quote_details}
                        </p>
                      </div>
                    )}

                    <IndicativeNote>
                      This quote was prepared with the hospital for your case. It can change if the
                      doctor finds that your treatment plan needs to differ after examination — your
                      case manager will tell you before anything is agreed.
                    </IndicativeNote>
                  </>
                )}

                {match.status === "patient_interested" ? (
                  <p className="flex items-start gap-2 rounded-md border border-success/25 bg-success-subtle p-3 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    You have told us you want to proceed here. Your case manager has been notified
                    and will confirm the next step in Messages.
                  </p>
                ) : match.status === "declined" ? (
                  <p className="text-sm text-muted-foreground">
                    You asked us not to proceed with this hospital. Tell your case manager if you
                    change your mind.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <form action={respondToMatchAction}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <input type="hidden" name="intent" value="interested" />
                      <Button type="submit">I am interested in this hospital</Button>
                    </form>
                    <form action={respondToMatchAction}>
                      <input type="hidden" name="match_id" value={match.id} />
                      <input type="hidden" name="intent" value="decline" />
                      <Button type="submit" variant="outline">
                        Not this one
                      </Button>
                    </form>
                  </div>
                )}

                {match.hospital && (
                  <Link
                    href={`/hospitals/${match.hospital.slug}`}
                    className="inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Read more about {match.hospital.name}
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}

          <p className="text-sm text-muted-foreground">
            Indicating interest does not book anything and there is no payment on this platform.
            Your case manager arranges everything with the hospital and confirms it with you first.
          </p>
        </div>
      )}
    </>
  );
}
