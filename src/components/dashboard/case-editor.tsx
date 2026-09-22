"use client";

import { useActionState } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import { updateCaseAction, type ActionResult } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MedicalCase, Treatment } from "@/lib/types";

const FLEXIBILITY_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "fixed", label: "These dates are fixed" },
  { value: "flexible_weeks", label: "Flexible by a couple of weeks" },
  { value: "flexible_month", label: "Flexible by a month or more" },
  { value: "unsure", label: "Not sure yet" },
];

/** Splits the stored "YYYY-MM-DD to YYYY-MM-DD" travel window back into inputs. */
function splitWindow(value: string) {
  const [from, to] = value.split(" to ");
  const isDate = (candidate?: string) => Boolean(candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate));
  return { from: isDate(from) ? from : "", to: isDate(to) ? to : "" };
}

export function CaseEditor({
  medicalCase,
  treatments,
  currentTreatmentSlug,
}: {
  medicalCase: MedicalCase;
  treatments: Treatment[];
  currentTreatmentSlug: string;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateCaseAction, {});
  const window = splitWindow(medicalCase.travel_window);

  if (medicalCase.locked) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-md bg-warning-subtle p-4 text-sm text-warning">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Your case is locked while your case manager finalises arrangements with the hospital.
            Message them and they will make any change for you.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="case_id" value={medicalCase.id} />

      <div className="space-y-2">
        <Label htmlFor="treatment_slug">Treatment</Label>
        <Select id="treatment_slug" name="treatment_slug" defaultValue={currentTreatmentSlug}>
          {treatments.map((treatment) => (
            <option key={treatment.slug} value={treatment.slug}>
              {treatment.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis_text">Diagnosis and symptoms</Label>
        <Textarea
          id="diagnosis_text"
          name="diagnosis_text"
          defaultValue={medicalCase.diagnosis_text}
          className="min-h-[150px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="travel_from">Earliest travel date</Label>
          <Input id="travel_from" name="travel_from" type="date" defaultValue={window.from} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="travel_to">Latest travel date</Label>
          <Input id="travel_to" name="travel_to" type="date" defaultValue={window.to} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="travel_flexibility">Flexibility</Label>
          <Select
            id="travel_flexibility"
            name="travel_flexibility"
            defaultValue={medicalCase.travel_flexibility}
          >
            {FLEXIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendants_count">Attendants travelling with you</Label>
          <Select
            id="attendants_count"
            name="attendants_count"
            defaultValue={String(medicalCase.attendants_count)}
          >
            <option value="0">Travelling alone</option>
            <option value="1">1 attendant</option>
            <option value="2">2 attendants</option>
          </Select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save changes
      </Button>
    </form>
  );
}
