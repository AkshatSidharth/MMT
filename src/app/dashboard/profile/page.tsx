import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, Plane } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PrivacyNote } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { countryByCode, countryName } from "@/lib/reference-data";

export const metadata: Metadata = { title: "Profile & KYC" };

export default async function ProfilePage() {
  const user = await requirePatient();
  const profile = await db.getProfile(user.id);
  const nationality = countryByCode(profile?.nationality);
  const verified = profile?.kyc_status === "verified";

  return (
    <>
      <PageHeader
        title="Profile & KYC"
        description="We need these details to prepare your visa invitation letter and hospital admission paperwork."
      >
        <Badge variant={verified ? "success" : "warning"}>
          {verified ? (
            <>
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Verified
            </>
          ) : (
            <>
              <Clock className="size-3.5" aria-hidden="true" />
              Verification pending
            </>
          )}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>
              Names must match your passport exactly — hospitals and the visa authority both check
              this.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileForm profile={profile} fallbackName={user.full_name ?? ""} />
            <PrivacyNote />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {verified ? (
                <p>
                  Your identity documents have been checked by our team. Nothing further is needed
                  from you.
                </p>
              ) : (
                <p>
                  A member of our team checks your passport copy by hand, usually within one working
                  day of you uploading it. You do not need to do anything while it is pending, and
                  your case continues in the meantime.
                </p>
              )}
              <p>Contact details on file: {user.email ?? user.phone ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plane className="size-4 text-primary" aria-hidden="true" />
                Visa pathway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {profile?.nationality ? (
                nationality?.eMedicalVisa ? (
                  <p>
                    Nationals of {countryName(profile.nationality)} are generally eligible for
                    India&apos;s <strong className="text-foreground">e-Medical Visa</strong>, applied
                    for online. Up to two attendants can travel on linked e-Medical Attendant visas.
                  </p>
                ) : (
                  <p>
                    We will confirm the correct route for nationals of{" "}
                    {countryName(profile.nationality)} — the e-Medical Visa scheme does not cover
                    every country, and a regular medical visa may be needed instead.
                  </p>
                )
              ) : (
                <p>Add your nationality and we will tell you which visa route applies to you.</p>
              )}
              <p>
                An e-Medical Visa application needs an invitation letter from the treating hospital.
                Your case manager uploads it to{" "}
                <Link href="/dashboard/documents" className="text-primary underline">
                  Documents
                </Link>{" "}
                once your hospital is confirmed.
              </p>
              <p className="text-xs">
                This is general information, not immigration advice. Requirements are set by the
                Government of India and can change.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
