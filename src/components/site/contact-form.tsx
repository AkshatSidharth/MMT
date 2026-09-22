"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { createLeadAction, type LeadResult } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/reference-data";
import type { Treatment } from "@/lib/types";

export function ContactForm({ treatments }: { treatments: Treatment[] }) {
  const [state, action, pending] = useActionState<LeadResult, FormData>(createLeadAction, {});

  if (state.ok) {
    return (
      <p className="flex items-start gap-2 rounded-md border border-success/25 bg-success-subtle p-4 text-success">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="source" value="contact_form" />

      <div className="space-y-2">
        <Label htmlFor="contact_name">Your name</Label>
        <Input id="contact_name" name="name" required autoComplete="name" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Email</Label>
          <Input id="contact_email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Phone or WhatsApp</Label>
          <Input
            id="contact_phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+234 802 000 0000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_country">Your country</Label>
          <Select id="contact_country" name="country" defaultValue="">
            <option value="">Select your country</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_treatment">Treatment you are asking about</Label>
          <Select id="contact_treatment" name="treatment_interest" defaultValue="">
            <option value="">Not sure yet</option>
            {treatments.map((treatment) => (
              <option key={treatment.slug} value={treatment.slug}>
                {treatment.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_message">How can we help?</Label>
        <Textarea
          id="contact_message"
          name="message"
          required
          className="min-h-[140px]"
          placeholder="Tell us briefly about the patient and what you need. Please do not paste full medical records here — you can upload them securely once you start a case."
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send message
      </Button>
      <p className="text-sm text-muted-foreground">
        We use your details only to reply to this enquiry.
      </p>
    </form>
  );
}
