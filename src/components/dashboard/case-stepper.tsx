import { Check } from "lucide-react";
import { CASE_STATUSES, CASE_STATUS_LABELS, type CaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Visual progress through the fulfilment journey. Driven by the admin. */
export function CaseStepper({ status }: { status: CaseStatus }) {
  const currentIndex = CASE_STATUSES.indexOf(status);

  return (
    <ol className="space-y-0">
      {CASE_STATUSES.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const last = index === CASE_STATUSES.length - 1;

        return (
          <li key={step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-success bg-success text-success-foreground",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn("w-0.5 flex-1", index < currentIndex ? "bg-success" : "bg-border")}
                />
              )}
            </div>
            <div className={cn("pb-6", last && "pb-0")}>
              <p
                className={cn(
                  "font-medium",
                  current && "text-primary",
                  !done && !current && "text-muted-foreground",
                )}
              >
                {CASE_STATUS_LABELS[step]}
                {current && <span className="sr-only"> (current stage)</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact one-line version for tables and card headers. */
export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const index = CASE_STATUSES.indexOf(status);
  const tone =
    status === "aftercare"
      ? "bg-success-subtle text-success"
      : index >= 4
        ? "bg-primary-subtle text-primary"
        : "bg-secondary text-secondary-foreground";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>
      {CASE_STATUS_LABELS[status]}
    </span>
  );
}
