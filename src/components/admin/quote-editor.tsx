"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { saveQuoteAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUsd } from "@/lib/utils";
import type { QuoteLine } from "@/lib/types";

const DEFAULT_LINES: QuoteLine[] = [
  { label: "Surgery and hospital stay", amount: 0 },
  { label: "Pre-operative workup", amount: 0 },
  { label: "Post-discharge follow-up", amount: 0 },
  { label: "Facilitation and case management fee", amount: 0 },
];

/**
 * Builds the consolidated quote the patient sees. The total is the sum of the
 * line items, so the breakdown and the headline figure can never disagree.
 */
export function QuoteEditor({
  caseId,
  matchId,
  hospitalName,
  initialLines,
  initialDetails,
}: {
  caseId: string;
  matchId: string;
  hospitalName: string;
  initialLines: QuoteLine[];
  initialDetails: string | null;
}) {
  const [lines, setLines] = useState<QuoteLine[]>(
    initialLines.length > 0 ? initialLines : DEFAULT_LINES,
  );
  const [state, action, pending] = useActionState<AdminResult, FormData>(saveQuoteAction, {});
  const total = lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0);

  function update(index: number, patch: Partial<QuoteLine>) {
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="match_id" value={matchId} />

      <div className="space-y-3">
        <Label>Line items for {hospitalName}</Label>
        {lines.map((line, index) => (
          <div key={index} className="flex gap-2">
            <Input
              name="line_label"
              value={line.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="What this covers"
              aria-label={`Line item ${index + 1} description`}
              className="flex-1"
            />
            <Input
              name="line_amount"
              type="number"
              min={0}
              step={50}
              value={Number.isFinite(line.amount) ? line.amount : 0}
              onChange={(event) => update(index, { amount: Number(event.target.value) })}
              aria-label={`Line item ${index + 1} amount in US dollars`}
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove line item ${index + 1}`}
              onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLines((current) => [...current, { label: "", amount: 0 }])}
        >
          <Plus className="size-4" />
          Add line
        </Button>
      </div>

      <div className="flex items-baseline justify-between rounded-md bg-secondary p-4">
        <span className="font-medium">Total the patient sees</span>
        <span className="text-2xl font-semibold text-primary">{formatUsd(total)}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`details-${matchId}`}>What this covers and excludes</Label>
        <Textarea
          id={`details-${matchId}`}
          name="quote_details"
          defaultValue={initialDetails ?? ""}
          placeholder="Spell out inclusions, length of stay, and what is not covered (flights, accommodation outside hospital, unrelated conditions found during workup)."
          className="min-h-[120px]"
        />
        <p className="text-sm text-muted-foreground">
          This text appears verbatim on the patient&apos;s quote. Be explicit about exclusions.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Publish quote to patient
      </Button>
    </form>
  );
}
