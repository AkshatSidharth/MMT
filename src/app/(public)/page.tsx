import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  HeartPulse,
  Languages,
  MessageCircle,
  Quote,
  ShieldCheck,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { HospitalCard, TreatmentCard } from "@/components/site/cards";
import { IndicativeNote, TrustBar } from "@/components/site/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { JOURNEY_STEPS, FAQS } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";
import { formatUsd, formatUsdBand } from "@/lib/utils";

/** Treatments given prominence on the landing page. */
const FEATURED_TREATMENT_SLUGS = [
  "heart-bypass-surgery",
  "knee-replacement",
  "liver-transplant",
  "cancer-treatment",
  "spinal-fusion",
  "ivf",
];

const COST_TEASER_SLUGS = ["heart-bypass-surgery", "knee-replacement", "bone-marrow-transplant"];

const TESTIMONIALS = [
  {
    quote:
      "I had an angiography report and no idea what to do with it. Within a week I had two hospitals, a video call with the surgeon, and a price that did not change when I arrived.",
    name: "Aminata B.",
    context: "Bypass surgery · travelled from Nigeria",
  },
  {
    quote:
      "What mattered was that one person answered every message. My mother is 71 and we were doing this from another country — having a named case manager made it possible.",
    name: "Rahim C.",
    context: "Knee replacement · travelled from Bangladesh",
  },
  {
    quote:
      "They told me plainly that the first hospital we looked at was not the strongest for my son's transplant, and suggested another. That honesty is why I trusted the rest.",
    name: "Fatima A.",
    context: "Paediatric transplant · travelled from Oman",
  },
];

export default async function HomePage() {
  const [treatments, hospitals, doctors] = await Promise.all([
    db.listTreatments(),
    db.listHospitals(),
    db.listDoctors(),
  ]);

  const featured = FEATURED_TREATMENT_SLUGS.map((slug) =>
    treatments.find((treatment) => treatment.slug === slug),
  ).filter((treatment): treatment is NonNullable<typeof treatment> => Boolean(treatment));

  const teasers = COST_TEASER_SLUGS.map((slug) =>
    treatments.find((treatment) => treatment.slug === slug),
  ).filter((treatment): treatment is NonNullable<typeof treatment> => Boolean(treatment));

  const featuredHospitals = hospitals.slice(0, 6);
  const faqPreview = FAQS.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary-subtle/70 to-background">
        <div className="container grid gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="success" className="mb-4">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              NABH & JCI accredited hospitals
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.5rem]">
              World-class treatment in India, at a fraction of the cost
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Share your case once. A named case manager shortlists accredited hospitals, arranges a
              consultation with the treating doctor, and comes back with one clear quote — treatment,
              stay, follow-up and our fee, with nothing hidden.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/cost-estimator">
                  Get a Free Treatment Estimate
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/hospitals">Browse Hospitals</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                Free to enquire
              </li>
              <li className="flex items-center gap-2">
                <UserCheck className="size-4 text-success" aria-hidden="true" />
                One named case manager
              </li>
              <li className="flex items-center gap-2">
                <Languages className="size-4 text-success" aria-hidden="true" />
                Interpreters available
              </li>
            </ul>
          </div>

          <Card className="lg:justify-self-end lg:max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="size-5 text-success" aria-hidden="true" />
                What patients typically save
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teasers.map((treatment) => {
                const usCost = treatment.home_country_reference_costs.US;
                return (
                  <div key={treatment.slug} className="border-b pb-4 last:border-0 last:pb-0">
                    <p className="font-medium">{treatment.name}</p>
                    <dl className="mt-1 flex flex-wrap items-baseline gap-x-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">In India</dt>
                        <dd className="text-lg font-semibold text-primary">
                          {formatUsdBand(
                            treatment.indicative_cost_min,
                            treatment.indicative_cost_max,
                          )}
                        </dd>
                      </div>
                      {usCost && (
                        <div>
                          <dt className="text-muted-foreground">In the US</dt>
                          <dd className="text-lg font-semibold text-muted-foreground line-through decoration-muted-foreground/40">
                            {formatUsd(usCost)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                );
              })}
              <IndicativeNote className="text-xs">
                Indicative bands from published reference data, not quotations. Your figure is
                confirmed after a doctor reviews your case.
              </IndicativeNote>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/cost-estimator">Estimate my treatment</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <TrustBar />

      {/* How it works */}
      <section className="container py-14 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            Five steps, one person accountable throughout. Nothing is automated behind your back.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {JOURNEY_STEPS.slice(0, 5).map((step, index) => (
            <li key={step.title} className="rounded-lg border bg-card p-6">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.summary}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/how-it-works">
              See the full patient journey
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured treatments */}
      <section className="border-y bg-secondary/40 py-14 lg:py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Treatments we arrange</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Every treatment page shows what the procedure involves, an indicative cost band, and
                which accredited hospitals are listed as offering it.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/treatments">All treatments</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured hospitals */}
      <section className="container py-14 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Accredited hospitals</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Reference listings compiled from published sources. Shown for information — your
              hospital is confirmed by your case manager, with you.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/hospitals">Full directory</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredHospitals.map((hospital) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              doctorCount={doctors.filter((doctor) => doctor.hospital_id === hospital.id).length}
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y bg-secondary/40 py-14 lg:py-20">
        <div className="container">
          <h2 className="text-3xl font-semibold sm:text-4xl">What patients tell us</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Shared with permission. Names shortened at their request.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure key={testimonial.name} className="rounded-lg border bg-card p-6">
                <Quote className="size-6 text-primary/40" aria-hidden="true" />
                <blockquote className="mt-3 text-[1.0625rem] leading-relaxed">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="block text-muted-foreground">{testimonial.context}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="container py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Questions people ask first</h2>
            <p className="mt-3 text-muted-foreground">
              If something is not answered here, ask us directly — no obligation, and you will get a
              straight answer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/faq">Read the full FAQ</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Contact us
                </Link>
              </Button>
            </div>
          </div>

          <dl className="space-y-6">
            {faqPreview.map((faq) => (
              <div key={faq.question} className="border-b pb-6 last:border-0 last:pb-0">
                <dt className="font-semibold">{faq.question}</dt>
                <dd className="mt-2 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t bg-primary py-14 text-primary-foreground lg:py-20">
        <div className="container text-center">
          <HeartPulse className="mx-auto size-10" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Start with an estimate. Decide nothing today.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/85">
            Tell us what you need and upload whatever reports you have. There is no payment on this
            platform, and no obligation to proceed at any stage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/cost-estimator">Get a Free Treatment Estimate</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/70">
            {siteConfig.name} is a medical travel facilitator, not a hospital, and does not provide
            medical advice.
          </p>
        </div>
      </section>
    </>
  );
}
