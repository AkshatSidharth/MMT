"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { addMatchAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Hospital } from "@/lib/types";

export function MatchPicker({
  caseId,
  suggested,
  others,
  matchedIds,
}: {
  caseId: string;
  suggested: Hospital[];
  others: Hospital[];
  matchedIds: string[];
}) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(addMatchAction, {});
  const matched = new Set(matchedIds);

  const option = (hospital: Hospital) => (
    <option key={hospital.id} value={hospital.id} disabled={matched.has(hospital.id)}>
      {hospital.name} · {hospital.city}
      {matched.has(hospital.id) ? " (matched)" : ""}
    </option>
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <div className="flex flex-wrap gap-2">
        <Select name="hospital_id" className="h-10 max-w-md flex-1" aria-label="Hospital to match">
          <option value="">Choose a hospital…</option>
          {suggested.length > 0 && (
            <optgroup label="Offers this treatment">{suggested.map(option)}</optgroup>
          )}
          <optgroup label="All other hospitals">{others.map(option)}</optgroup>
        </Select>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add match
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}
    </form>
  );
}
