import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

/** Accreditation chip. Green is reserved for accreditation and positive states. */
export function AccreditationBadge({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const titles: Record<string, string> = {
    NABH: "National Accreditation Board for Hospitals & Healthcare Providers (India)",
    JCI: "Joint Commission International",
    NABL: "National Accreditation Board for Testing and Calibration Laboratories",
    ISO: "ISO certified",
  };
  return (
    <span
      title={titles[code] ?? code}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-success/25 bg-success-subtle px-2.5 py-0.5 text-xs font-semibold text-success",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      {code}
    </span>
  );
}

export function TrustBar() {
  return (
    <section className="border-y bg-secondary/60 py-6" aria-label="Why patients trust us">
      <div className="container grid gap-6 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-semibold">NABH & JCI accredited hospitals only</p>
            <p className="text-sm text-muted-foreground">
              We list hospitals that hold recognised accreditation, and we show you the badge.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {siteConfig.patientsPerYear} international patients treated in India each year
            </p>
            <p className="text-sm text-muted-foreground">
              Public estimates for annual medical travel to India before 2020.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold">Your records stay confidential</p>
            <p className="text-sm text-muted-foreground">
              Documents are stored in private, encrypted storage and shared only with the hospitals
              you approve.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-md bg-primary-subtle p-3 text-sm text-primary",
        className,
      )}
    >
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Your data is confidential. Files are stored privately, are never shown on the public site,
        and are shared with a hospital only after you approve it.
      </span>
    </p>
  );
}

/** Used wherever a cost or package is shown, so nothing reads as a firm price. */
export function IndicativeNote({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children ??
        "Indicative estimate based on publicly available reference data. Your final quote is confirmed after the doctor reviews your case."}
    </p>
  );
}
