"use client";

import { useState, useTransition } from "react";
import { Check, Globe, Loader2 } from "lucide-react";
import { setLanguageAction } from "@/app/actions/language";
import { LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/types";

export function LanguageSwitcher({
  current,
  className,
}: {
  current: Language;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const active = LANGUAGES.find((language) => language.code === current) ?? LANGUAGES[0];

  function choose(code: Language) {
    startTransition(async () => {
      const result = await setLanguageAction(code);
      setOpen(false);
      if (result.ok && !result.available) {
        setNotice(
          "We have saved your preference. Pages are still shown in English while translation is in progress — your case manager can speak with you in this language.",
        );
      } else {
        setNotice(null);
      }
    });
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Globe className="size-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{active.native}</span>
        <span className="sr-only">Change language</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 z-50 mt-1 w-60 overflow-hidden rounded-md border bg-background p-1 shadow-lg"
        >
          {LANGUAGES.map((language) => (
            <li key={language.code}>
              <button
                type="button"
                role="option"
                aria-selected={language.code === current}
                onClick={() => choose(language.code)}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-start text-sm hover:bg-accent"
              >
                <span>
                  <span className="font-medium">{language.native}</span>
                  <span className="text-muted-foreground"> · {language.label}</span>
                  {!language.available && (
                    <span className="block text-xs text-muted-foreground">
                      Interface in English for now
                    </span>
                  )}
                </span>
                {language.code === current && <Check className="size-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {notice && (
        <p className="absolute end-0 top-12 z-50 w-72 rounded-md border bg-background p-3 text-xs text-muted-foreground shadow-lg">
          {notice}
          <button
            type="button"
            className="mt-2 block font-medium text-primary underline"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </p>
      )}
    </div>
  );
}
