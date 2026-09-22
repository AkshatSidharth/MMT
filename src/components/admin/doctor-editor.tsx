"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveDoctorAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Doctor, Hospital } from "@/lib/types";

export function DoctorEditor({
  doctor,
  hospitals,
  defaultHospitalId,
}: {
  doctor: Doctor | null;
  hospitals: Hospital[];
  defaultHospitalId?: string;
}) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(saveDoctorAction, {});

  return (
    <form action={action} className="space-y-5">
      {doctor && <input type="hidden" name="id" value={doctor.id} />}

      <div className="space-y-2">
        <Label htmlFor="hospital_id">Hospital</Label>
        <Select
          id="hospital_id"
          name="hospital_id"
          required
          defaultValue={doctor?.hospital_id ?? defaultHospitalId ?? ""}
        >
          <option value="">Choose a hospital…</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name} · {hospital.city}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doctor_name_field">Name</Label>
          <Input
            id="doctor_name_field"
            name="name"
            required
            defaultValue={doctor?.name ?? ""}
            placeholder="Dr. A. Raghunathan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            name="specialty"
            required
            defaultValue={doctor?.specialty ?? ""}
            placeholder="Cardiothoracic surgery"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualifications">Qualifications</Label>
        <Input
          id="qualifications"
          name="qualifications"
          defaultValue={doctor?.qualifications ?? ""}
          placeholder="MBBS, MS, MCh (Cardiothoracic)"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="years_experience">Years of experience</Label>
          <Input
            id="years_experience"
            name="years_experience"
            type="number"
            min={0}
            max={70}
            defaultValue={doctor?.years_experience ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doctor_photo">Photo URL</Label>
          <Input
            id="doctor_photo"
            name="photo_url"
            type="url"
            defaultValue={doctor?.photo_url ?? ""}
          />
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
        {doctor ? "Save doctor" : "Add doctor"}
      </Button>
    </form>
  );
}
