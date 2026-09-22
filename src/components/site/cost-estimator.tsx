"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, Loader2, TrendingDown } from "lucide-react";
import { createLeadAction, type LeadResult } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { IndicativeNote } from "@/components/site/trust";
import { COUNTRIES, estimateHomeCountryCost } from "@/lib/reference-data";
import { formatUsd, formatUsdBand } from "@/lib/utils";
import type { Treatment } from "@/lib/types";

/**
 * Interactive indicative comparison, then a lead capture. Nothing here is a
 * quote: the figures come from the reference cost bands ops maintains.
 */
export function CostEstimator({
  treatments,
  initialTreatmentSlug,
}: {
  treatments: Treatment[];
  initialTreatmentSlug?: string;
}) {
  const [slug, setSlug] = useState(initialTreatmentSlug ?? treatments[0]?.slug ?? "");
  const [countryCode, setCountryCode] = useState("US");
  const [state, action, pending] = useActionState<LeadResult, FormData>(createLeadAction, {});

  const treatment = treatments.find((item) => item.slug === slug);
  const country = COUNTRIES.find((item) => item.code === countryCode);

  const comparison = useMemo(() => {
    if (!treatment || !country) return null;
    const homeCost = estimateHomeCountryCost(treatment.home_country_reference_costs, country.code);
    const indiaMid = Math.round(
      (treatment.indicative_cost_min + treatment.indicative_cost_max) / 2,
    );
    if (!homeCost || homeCost <= indiaMid) {
      return { homeCost, indiaMid, savings: null, percent: null };
    }
    return {
      homeCost,
      indiaMid,
      savings: homeCost - indiaMid,
      percent: Math.round(((homeCost - indiaMid) / homeCost) * 100),
    };
  }, [treatment, country]);

  const grouped = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    treatments.forEach((item) => {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    });
    return [...map.entries()];
  }, [treatments]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" aria-hidden="true" />
            Your indicative estimate
          </CardTitle>
          <CardDescription>
            Choose the treatment and where you would otherwise be treated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="estimator_treatment">Treatment</Label>
            <Select
              id="estimator_treatment"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            >
              {grouped.map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimator_country">Your home country</Label>
            <Select
              id="estimator_country"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
            >
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          {treatment && comparison && (
            <div className="space-y-4 rounded-lg border bg-secondary/40 p-5">
              <div>
                <p className="text-sm text-muted-foreground">Indicative cost in India</p>
                <p className="text-3xl font-semibold text-primary">
                  {formatUsdBand(treatment.indicative_cost_min, treatment.indicative_cost_max)}
                </p>
                {treatment.stay_summary && (
                  <p className="text-sm text-muted-foreground">{treatment.stay_summary}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Typical private cost in {country?.name}
                </p>
                <p className="text-2xl font-semibold">
                  {comparison.homeCost ? formatUsd(comparison.homeCost) : "Not available"}
                </p>
              </div>

              {comparison.savings !== null && (
                <div className="flex items-start gap-3 rounded-md border border-success/25 bg-success-subtle p-4">
                  <TrendingDown className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-success">
                      Indicative saving of about {formatUsd(comparison.savings)}
                    </p>
                    <p className="text-sm text-success/90">
                      Around {comparison.percent}% less than being treated privately in{" "}
                      {country?.name}, before flights and accommodation.
                    </p>
                  </div>
                </div>
              )}

              <IndicativeNote>
                These are reference figures compiled from published data, not a quotation. In many
                countries this treatment may not be available locally at all. Your real figure comes
                from the hospital after a doctor has reviewed your reports.
              </IndicativeNote>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send me the detailed estimate</CardTitle>
          <CardDescription>
            We will email a written breakdown for your case and a case manager will follow up. No
            payment, no obligation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.ok ? (
            <div className="space-y-5">
              <p className="flex items-start gap-2 rounded-md border border-success/25 bg-success-subtle p-4 text-sm text-success">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {state.message}
              </p>
              <div className="rounded-lg border p-5">
                <p className="font-medium">Get a real answer faster</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an account and upload your reports. A doctor&apos;s opinion needs your
                  actual scans and test results — that is what turns an estimate into a quote.
                </p>
                <Button asChild className="mt-4">
                  <Link href={`/sign-in?next=${encodeURIComponent(`/intake?treatment=${slug}`)}`}>
                    Start my case
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <input type="hidden" name="source" value="cost_estimator" />
              <input type="hidden" name="treatment_interest" value={slug} />
              <input type="hidden" name="country" value={countryCode} />

              <div className="space-y-2">
                <Label htmlFor="lead_name">Your name</Label>
                <Input id="lead_name" name="name" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_email">Email</Label>
                <Input
                  id="lead_email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_phone">Phone or WhatsApp number</Label>
                <Input
                  id="lead_phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234 802 000 0000"
                />
              </div>

              {state.error && (
                <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Send me the detailed estimate
              </Button>
              <p className="text-sm text-muted-foreground">
                We use your details only to prepare your estimate and contact you about it.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
