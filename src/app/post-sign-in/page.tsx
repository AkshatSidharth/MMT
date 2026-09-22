import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Single place that decides where a freshly signed-in user lands: language
 * choice on first sign-in, then the admin workspace, an existing case, or
 * intake for a patient who has not submitted one yet.
 */
export default async function PostSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!user.language_chosen) redirect(`/welcome?next=${encodeURIComponent(next)}`);
  if (user.role === "admin") redirect("/admin/pipeline");

  const cases = await db.listCasesByPatient(user.id);
  if (cases.length === 0 && !next.startsWith("/intake")) redirect("/intake");

  redirect(next);
}
