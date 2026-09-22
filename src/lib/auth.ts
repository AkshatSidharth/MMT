import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role, User } from "@/lib/types";

export const LOCAL_SESSION_COOKIE = "mmt_local_session";

/**
 * Secret for the local fallback session cookie. In Supabase mode this is never
 * used; sessions are Supabase's own. A generated per-process secret is fine for
 * local development and means no secret is committed.
 */
const localSessionSecret =
  process.env.LOCAL_AUTH_SECRET?.trim() ||
  ((globalThis as unknown as { __mmtAuthSecret?: string }).__mmtAuthSecret ??=
    randomBytes(32).toString("hex"));

function sign(value: string) {
  return createHmac("sha256", localSessionSecret).update(value).digest("hex");
}

export function encodeLocalSession(userId: string) {
  return `${userId}.${sign(userId)}`;
}

function decodeLocalSession(token: string): string | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;
  const userId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(userId);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return userId;
}

/** Emails bootstrapped as admins on first sign-in. */
function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

async function getSupabaseUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const existing = await db.getUser(authUser.id);
  if (existing) return existing;

  // The auth trigger normally creates this row; recover if it has not run.
  return db.createUser({
    id: authUser.id,
    email: authUser.email ?? null,
    phone: authUser.phone ?? null,
    full_name:
      (authUser.user_metadata?.full_name as string | undefined) ??
      (authUser.user_metadata?.name as string | undefined) ??
      null,
    role: isBootstrapAdminEmail(authUser.email) ? "admin" : "patient",
  });
}

async function getLocalUser(): Promise<User | null> {
  const token = (await cookies()).get(LOCAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = decodeLocalSession(token);
  if (!userId) return null;
  return db.getUser(userId);
}

/** The signed-in user, or null. Safe to call from any server component. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return isSupabaseConfigured ? await getSupabaseUser() : await getLocalUser();
  } catch {
    return null;
  }
}

export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requirePatient(nextPath = "/dashboard"): Promise<User> {
  const user = await requireUser(nextPath);
  // Admins browsing the patient area are sent to their own workspace.
  if (user.role !== "patient") redirect("/admin/pipeline");
  return user;
}

export async function requireAdmin(nextPath = "/admin/pipeline"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export async function assertRole(user: User | null, role: Role) {
  if (!user || user.role !== role) throw new Error("Not authorised");
  return user;
}

/** Sets the local fallback session cookie. No-op in Supabase mode. */
export async function setLocalSession(userId: string) {
  const store = await cookies();
  store.set(LOCAL_SESSION_COOKIE, encodeLocalSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearLocalSession() {
  (await cookies()).delete(LOCAL_SESSION_COOKIE);
}
