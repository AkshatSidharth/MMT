"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { clearLocalSession, getCurrentUser, isBootstrapAdminEmail, setLocalSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE } from "@/lib/language";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Digits, optional leading +. Deliberately permissive: numbering plans vary. */
function normalisePhone(raw: string) {
  const trimmed = raw.replace(/[\s()-]/g, "");
  if (!/^\+?\d{7,15}$/.test(trimmed)) return null;
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function safeNext(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export type AuthState = { error?: string; devCode?: string; phone?: string; step?: "code" };

/**
 * Local fallback only. Supabase sends the SMS itself from the browser client.
 * Here the code is generated server-side and surfaced in the UI, clearly
 * labelled, so the flow can be exercised without an SMS provider.
 */
export async function requestPhoneOtpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (isSupabaseConfigured) return { error: "Handled by Supabase in the browser." };

  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Enter your phone number with country code, for example +234 802 000 0000." };

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.saveOtp?.(phone, code, expiresAt);

  return { step: "code", phone, devCode: code };
}

export async function verifyPhoneOtpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (isSupabaseConfigured) return { error: "Handled by Supabase in the browser." };

  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const code = String(formData.get("code") ?? "").trim();
  const next = safeNext(formData.get("next"));
  if (!phone) return { error: "That phone number does not look right." };
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const ok = await db.consumeOtp?.(phone, code);
  if (!ok) return { step: "code", phone, error: "That code is not valid or has expired." };

  const existing = await db.getUserByPhone(phone);
  const user = existing ?? (await db.createUser({ phone, role: "patient" }));
  await setLocalSession(user.id);
  revalidatePath("/", "layout");
  redirect(`/post-sign-in?next=${encodeURIComponent(next)}`);
}

/**
 * Local fallback stand-in for Google sign-in: identifies the user by email
 * without a password. Never reachable once Supabase is configured.
 */
export async function localEmailSignInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (isSupabaseConfigured) return { error: "Handled by Supabase in the browser." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const next = safeNext(formData.get("next"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };

  const existing = await db.getUserByEmail(email);
  const user =
    existing ??
    (await db.createUser({
      email,
      full_name: fullName || null,
      role: isBootstrapAdminEmail(email) ? "admin" : "patient",
    }));

  await setLocalSession(user.id);
  revalidatePath("/", "layout");
  redirect(`/post-sign-in?next=${encodeURIComponent(next)}`);
}

/** Local fallback only: sign in as one of the seeded demo accounts. */
export async function demoSignInAction(formData: FormData) {
  if (isSupabaseConfigured) return;
  const role = String(formData.get("role") ?? "patient");

  if (role === "admin") {
    const [admin] = await db.listAdmins();
    if (admin) {
      await setLocalSession(admin.id);
      revalidatePath("/", "layout");
      redirect("/admin/pipeline");
    }
    return;
  }

  const cases = await db.listCases();
  const withPatient = cases.find((item) => item.patient);
  if (withPatient?.patient) {
    await setLocalSession(withPatient.patient.id);
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    await clearLocalSession();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

/** Records the language chosen on the welcome step after first sign-in. */
export async function completeLanguageStepAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const next = safeNext(formData.get("next"));
  const language = String(formData.get("language") ?? "en");
  const allowed = ["en", "ar", "fr", "bn"] as const;
  const resolved = (allowed as readonly string[]).includes(language)
    ? (language as (typeof allowed)[number])
    : "en";

  await db.updateUser(user.id, { language: resolved, language_chosen: true });
  // Keep the cookie in step so the html lang/dir attributes follow immediately.
  (await cookies()).set(LANGUAGE_COOKIE, resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  // Hand back to the single routing decision, which knows whether this patient
  // still needs to complete intake.
  redirect(`/post-sign-in?next=${encodeURIComponent(next)}`);
}
