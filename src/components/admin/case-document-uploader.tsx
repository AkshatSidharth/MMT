"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadCaseDocumentAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-limits";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types";

/** Staff-issued paperwork: quotes, visa letters, treatment plans, discharge summaries. */
const ISSUABLE = ["quote", "visa_letter", "treatment_plan", "discharge_summary", "other"] as const;

export function CaseDocumentUploader({ caseId }: { caseId: string }) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(
    uploadCaseDocumentAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="case_id" value={caseId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doc_type">Document type</Label>
          <Select id="doc_type" name="type" defaultValue="quote">
            {ISSUABLE.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc_title">Title shown to the patient</Label>
          <Input id="doc_title" name="title" placeholder="Formal quote — Meridian Institute" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="doc_file">File</Label>
        <Input id="doc_file" type="file" name="file" accept={ACCEPT_ATTRIBUTE} required />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Upload and publish
      </Button>
    </form>
  );
}
