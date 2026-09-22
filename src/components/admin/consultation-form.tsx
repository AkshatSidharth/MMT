"use client";

import { useActionState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { scheduleConsultationAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Consultation, Hospital } from "@/lib/types";

/** Splits a stored ISO timestamp into the date and time inputs. */
function splitIso(iso: string | undefined) {
  if (!iso) return { date: "", time: "" };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: "", time: "" };
  const pad = (input: number) => String(input).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

export function ConsultationForm({
  caseId,
  consultation,
  hospitals,
}: {
  caseId: string;
  consultation: Consultation | null;
  hospitals: Hospital[];
}) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(
    scheduleConsultationAction,
    {},
  );
  const existing = splitIso(consultation?.scheduled_at);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Date</Label>
          <Input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            required
            defaultValue={existing.date}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_time">Time (your local time)</Label>
          <Input
            id="scheduled_time"
            name="scheduled_time"
            type="time"
            required
            defaultValue={existing.time}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consult_hospital">Hospital</Label>
        <Select
          id="consult_hospital"
          name="hospital_id"
          defaultValue={consultation?.hospital_id ?? ""}
        >
          <option value="">Not specified</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name} · {hospital.city}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doctor_name">Doctor (as the patient should see it)</Label>
        <Input
          id="doctor_name"
          name="doctor_name"
          required
          defaultValue={consultation?.doctor_name ?? ""}
          placeholder="Dr. A. Raghunathan, Cardiothoracic surgery"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="join_link">Joining link</Label>
        <Input
          id="join_link"
          name="join_link"
          type="url"
          inputMode="url"
          defaultValue={consultation?.join_link ?? ""}
          placeholder="https://meet.example.com/..."
        />
        <p className="text-sm text-muted-foreground">
          Paste the meeting URL the hospital gave you. There is no calendar integration — this is
          shown to the patient exactly as entered.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consult_notes">Note to the patient</Label>
        <Textarea
          id="consult_notes"
          name="notes"
          defaultValue={consultation?.notes ?? ""}
          placeholder="What to have ready, how long the call will take, whether an interpreter will join."
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CalendarClock className="size-4" />
        )}
        {consultation ? "Update consultation" : "Publish consultation"}
      </Button>
    </form>
  );
}
