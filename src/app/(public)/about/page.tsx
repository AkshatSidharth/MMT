import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Eye, HandHeart, Scale, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Who we are, how we vet hospitals, how we make money, and the limits of what a facilitator should claim.",
};

const PRINCIPLES = [
  {
    icon: Eye,
    title: "We tell you what we are",
    body: "We are a facilitator, not a hospital and not a doctor. We do not diagnose, we do not treat, and we do not tell you which operation to have. Where our knowledge ends, we say so and put you in front of someone whose knowledge does not.",
  },
  {
    icon: Scale,
    title: "Our fee is a line on your quote",
    body: "You see what we charge before you decide anything, as a separate line item alongside the hospital's costs. We do not add a hidden margin to the hospital's price, and we do not take a cut that depends on which hospital you choose.",
  },
  {
    icon: BadgeCheck,
    title: "Accreditation, shown not claimed",
    body: "We list hospitals holding recognised accreditation — NABH in India, JCI where they hold it — and we print the badge so you can verify it with the accrediting body yourself.",
  },
  {
    icon: Users,
    title: "A named person, not a queue",
    body: "One case manager owns your case end to end. You get their name and their contact details, and they answer in the same thread from your first question to your follow-up after discharge.",
  },
  {
    icon: HandHeart,
    title: "We will tell you when to go elsewhere",
    body: "If the hospital you asked about is not the strongest choice for your case, we will say so. If travelling for treatment is not in your interest at all, we will say that too.",
  },
  {
    icon: ShieldCheck,
    title: "Your records are yours",
    body: "Private encrypted storage, shared with a hospital only when you approve it, deletable by you, and never sold or handed to advertisers.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Why {siteConfig.name}</h1>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            Getting treatment in another country is one of the most stressful things a family can
            take on. Most of that stress is not medical — it is not knowing who to trust, what it
            will really cost, and whether anyone will answer when something goes wrong. That is the
            part we exist to fix.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl font-semibold">What we set out to do</h2>
          <div className="prose-readable mt-4">
            <p>
              India treats a very large number of international patients each year, at a fraction of
              what the same procedure costs privately in North America, Europe or the Gulf, and in
              hospitals that hold the same international accreditation. That opportunity is real.
              What is missing is a trustworthy way in.
            </p>
            <p>
              Families arrive with an angiography report and a WhatsApp number given to them by
              someone&apos;s cousin. They are quoted one figure and billed another. Nobody explains
              the visa. The person who was answering messages goes quiet at the worst moment.
            </p>
            <p>
              We built this platform so that a patient anywhere can share their case once, see
              honest indicative costs, speak to the doctor who would actually operate, and receive
              one written quote with the exclusions spelt out — with a named person accountable
              throughout.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold">How we work</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <Card key={principle.title}>
                <CardHeader className="pb-3">
                  <principle.icon className="size-6 text-primary" aria-hidden="true" />
                  <CardTitle className="mt-2 text-lg">{principle.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{principle.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl font-semibold">How we vet a hospital</h2>
          <ol className="prose-readable mt-4 list-decimal space-y-2 ps-6">
            <li>
              <strong className="text-foreground">Accreditation first.</strong> We confirm NABH or
              JCI status with the accrediting body, not from the hospital&apos;s own marketing.
            </li>
            <li>
              <strong className="text-foreground">Volume in the actual procedure.</strong> A large
              hospital is not automatically a strong unit for your operation. We look at whether
              that team does it routinely.
            </li>
            <li>
              <strong className="text-foreground">International patient infrastructure.</strong>{" "}
              Interpreters, attendant accommodation, a desk that answers email, and someone who has
              handled visa paperwork before.
            </li>
            <li>
              <strong className="text-foreground">Straight pricing.</strong> We drop hospitals that
              quote one figure to us and bill another to the patient.
            </li>
            <li>
              <strong className="text-foreground">What patients tell us afterwards.</strong> We ask
              every patient after discharge, and we act on the pattern rather than on one review.
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            We are open about the stage we are at: the directory on this site is reference material
            compiled from published sources while we complete hospital onboarding. It is labelled
            indicative everywhere it appears, and it is never presented as live bookable inventory.
          </p>
        </section>

        <section className="rounded-lg border bg-secondary/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Ask us something difficult</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            About our fee, about a hospital&apos;s record, about whether travelling is worth it in
            your case. A straight answer costs you nothing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
