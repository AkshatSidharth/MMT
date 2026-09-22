import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalSignIn } from "@/components/auth/local-sign-in";
import { SupabaseSignIn } from "@/components/auth/supabase-sign-in";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to manage your treatment case, upload medical records, view quotes and message your case manager.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin/pipeline" : next);

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in or create your account</CardTitle>
          <CardDescription>
            One account holds your case, your documents and your conversation with your case
            manager. Choose whichever option is easiest for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSupabaseConfigured ? <SupabaseSignIn next={next} /> : <LocalSignIn next={next} />}
        </CardContent>
      </Card>

      <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          We ask only for what we need to arrange your treatment. Your medical records are stored in
          private encrypted storage and are shared with a hospital only after you approve it. See
          our <Link href="/faq" className="text-primary underline">FAQ</Link> on privacy.
        </span>
      </p>
    </div>
  );
}
