"use client";

import { useActionState, useRef } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { uploadRecordsAction, type ActionResult } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-limits";

export function RecordUploader({ caseId }: { caseId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(uploadRecordsAction, {});

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center hover:border-primary hover:bg-primary-subtle/40">
        <FileUp className="size-6 text-primary" aria-hidden="true" />
        <span className="font-medium">Add reports, scans or prescriptions</span>
        <span className="text-sm text-muted-foreground">
          PDF or photo, up to 15 MB each. Uploading starts as soon as you choose the files.
        </span>
        <input
          type="file"
          name="records"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {pending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Uploading your files…
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}
      <Button type="submit" variant="outline" size="sm" className="sr-only">
        Upload
      </Button>
    </form>
  );
}
