"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveCaseNotesAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CaseNotes({ caseId, notes }: { caseId: string; notes: string | null }) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(saveCaseNotesAction, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <label htmlFor="admin_notes" className="sr-only">
        Internal notes
      </label>
      <Textarea
        id="admin_notes"
        name="admin_notes"
        defaultValue={notes ?? ""}
        placeholder="Internal only — never shown to the patient. Who you contacted, what the hospital said, what you are waiting on."
        className="min-h-[120px]"
      />
      {state.message && <p className="text-sm text-success">{state.message}</p>}
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save notes
      </Button>
    </form>
  );
}
