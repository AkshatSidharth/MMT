"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE } from "@/lib/language";
import { LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/types";

/** Stores the reading language for the visitor, and on their account if signed in. */
export async function setLanguageAction(code: string) {
  const option = LANGUAGES.find((language) => language.code === code);
  if (!option) return { ok: false as const, error: "Unknown language" };

  (await cookies()).set(LANGUAGE_COOKIE, option.code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.updateUser(user.id, { language: option.code as Language, language_chosen: true });
  }

  revalidatePath("/", "layout");
  return { ok: true as const, available: option.available };
}
