"use server";

import { db } from "@/lib/db";
import { COUNTRIES } from "@/lib/reference-data";

export type LeadResult = { ok?: true; error?: string; message?: string };

function validEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

/**
 * Captures a lead from the cost estimator or the contact form. This is the only
 * write the public site performs, and it is what appears in the admin pipeline.
 */
export async function createLeadAction(_prev: LeadResult, formData: FormData): Promise<LeadResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const country = String(formData.get("country") ?? "");
  const treatmentInterest = String(formData.get("treatment_interest") ?? "").trim();
  const source = String(formData.get("source") ?? "cost_estimator");
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) return { error: "Please tell us your name." };
  if (!validEmail(email)) return { error: "Enter a valid email address so we can send the estimate." };
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) {
    return { error: "That phone number does not look right. Include your country code." };
  }
  if (country && !COUNTRIES.some((item) => item.code === country)) {
    return { error: "Select your country." };
  }
  if (message.length > 4000) return { error: "Please shorten your message." };

  await db.createLead({
    name,
    email,
    phone,
    treatment_interest: treatmentInterest || null,
    country: country || null,
    source: source === "contact_form" ? "contact_form" : "cost_estimator",
    stage: "new",
    notes: message || null,
  });

  return {
    ok: true,
    message:
      source === "contact_form"
        ? "Thank you — your message has reached our team. We reply within one working day."
        : "Thank you. We will email your detailed estimate and a case manager will follow up.",
  };
}
