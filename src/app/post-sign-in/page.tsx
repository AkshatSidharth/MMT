import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolvePostSignInPath } from "@/lib/post-sign-in";

/**
 * Landing point for sign-ins that arrive as a plain HTTP redirect, notably the
 * OAuth callback. Server actions call resolvePostSignInPath() directly and
 * redirect once, so they never pass through here.
 */
export default async function PostSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  redirect(await resolvePostSignInPath(user, next));
}
