import "server-only";

import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export function safeNextPath(next: unknown, fallback = "/dashboard") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/**
 * Where a freshly signed-in user belongs: language choice on first sign-in, then
 * the admin workspace, an existing case, or intake for a patient who has not
 * submitted one yet.
 *
 * Callers redirect straight to the result rather than bouncing through
 * /post-sign-in, so a sign-in costs one redirect instead of a chain.
 */
export async function resolvePostSignInPath(user: User, rawNext?: unknown): Promise<string> {
  const next = safeNextPath(rawNext);

  if (!user.language_chosen) return `/welcome?next=${encodeURIComponent(next)}`;
  if (user.role === "admin") return "/admin/pipeline";

  const cases = await db.listCasesByPatient(user.id);
  if (cases.length === 0 && !next.startsWith("/intake")) return "/intake";

  return next;
}
