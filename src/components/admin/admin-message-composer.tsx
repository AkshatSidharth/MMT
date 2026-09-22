"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { sendAdminMessageAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AdminMessageComposer({ caseId }: { caseId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AdminResult, FormData>(
    sendAdminMessageAction,
    {},
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <label htmlFor="admin_body" className="sr-only">
        Message to the patient
      </label>
      <Textarea
        id="admin_body"
        name="body"
        required
        placeholder="Write to the patient. Keep it plain and specific — many patients read in a second language."
        className="min-h-[110px]"
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Replying assigns this case to you if it is unassigned.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send to patient
        </Button>
      </div>
    </form>
  );
}
