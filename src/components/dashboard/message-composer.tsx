"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { sendPatientMessageAction, type ActionResult } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({ caseId }: { caseId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    sendPatientMessageAction,
    {},
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <label htmlFor="body" className="sr-only">
        Your message
      </label>
      <Textarea
        id="body"
        name="body"
        required
        placeholder="Ask anything — about your quote, your visa, travel, or what to expect."
        className="min-h-[110px]"
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Replies usually arrive within one working day.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send
        </Button>
      </div>
    </form>
  );
}
