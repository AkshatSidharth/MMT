import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, MessageCircle, Plane, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOURNEY_STEPS } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The full patient journey: intake, matching, teleconsultation, quote, visa, travel, treatment, recovery and aftercare — with a named case manager throughout.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">How it works</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            From your first question to your follow-up review after you fly home. A person is
            accountable at every step — there is no automated booking engine deciding your care.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <ol className="mb-16 space-y-8">
          {JOURNEY_STEPS.map((step, index) => (
            <li key={step.title} className="grid gap-5 sm:grid-cols-[auto_1fr]">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <div className="border-b pb-8">
                <h2 className="text-xl font-semibold">{step.title}</h2>
                <p className="mt-1 font-medium text-primary">{step.summary}</p>
                <p className="mt-3 text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold">What we do and do not do</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-success">What we handle</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="prose-readable space-y-2">
                  <li>Reading your case and shortlisting hospitals that genuinely suit it.</li>
                  <li>Briefing hospital international desks and chasing them for a response.</li>
                  <li>Arranging the teleconsultation, with an interpreter if you want one.</li>
                  <li>Getting one consolidated quote with exclusions written down.</li>
                  <li>Obtaining the hospital&apos;s visa invitation letter for you and attendants.</li>
                  <li>Staying reachable through admission, treatment and discharge.</li>
                  <li>Filing your discharge summary and follow-up plan where you can get them.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What we do not do</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="prose-readable space-y-2">
                  <li>
                    We do not diagnose or treat. We are not a hospital and we give no medical
                    advice.
                  </li>
                  <li>
                    We do not offer instant booking against a doctor&apos;s calendar. Any site that
                    claims to is not telling you the truth about how hospitals work.
                  </li>
                  <li>We do not take payment for treatment. You pay the hospital directly.</li>
                  <li>
                    We do not present the directory as live inventory — it is reference material,
                    labelled indicative.
                  </li>
                  <li>We do not share your records with a hospital before you approve it.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "Your records stay private",
              body: "Uploads go into private encrypted storage. Only your case manager and the hospitals you approve ever see them.",
            },
            {
              icon: MessageCircle,
              title: "One thread, one person",
              body: "Everything happens in a single conversation with your named case manager, kept with your case.",
            },
            {
              icon: Plane,
              title: "Visa support, not visa promises",
              body: "We get the hospital invitation letter and explain your route. The decision is the Government of India's.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border bg-card p-6">
              <item.icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border bg-primary-subtle/60 p-6 text-center sm:p-8">
          <ShieldCheck className="mx-auto size-8 text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-semibold">Start with your case, not your card</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            There is no payment anywhere on {siteConfig.name}. Submitting your case costs nothing
            and commits you to nothing.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/sign-in?next=%2Fintake">
              Start my case
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
