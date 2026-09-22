import type { Metadata } from "next";
import { Globe } from "lucide-react";
import { completeLanguageStepAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { LANGUAGES } from "@/lib/i18n";

export const metadata: Metadata = { title: "Choose your language" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const user = await requireUser();

  return (
    <div className="w-full max-w-lg">
      <Card>
        <CardHeader>
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-subtle">
            <Globe className="size-5 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Which language should we use with you?</CardTitle>
          <CardDescription>
            We use this to match you with a case manager who speaks your language, and to send
            written updates you can read comfortably.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeLanguageStepAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <fieldset className="space-y-2">
              <legend className="sr-only">Preferred language</legend>
              {LANGUAGES.map((language) => (
                <label
                  key={language.code}
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary-subtle"
                >
                  <input
                    type="radio"
                    name="language"
                    value={language.code}
                    defaultChecked={language.code === user.language}
                    className="mt-1.5 size-4 accent-[hsl(var(--primary))]"
                  />
                  <span>
                    <span className="block font-medium">
                      {language.native} · {language.label}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {language.available
                        ? "Site and updates in English"
                        : "Spoken support in this language; site pages remain in English for now"}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <Button type="submit" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
