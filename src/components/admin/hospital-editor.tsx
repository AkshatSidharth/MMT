"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveHospitalAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Hospital, Treatment } from "@/lib/types";

const ACCREDITATIONS = ["NABH", "JCI", "NABL", "ISO"] as const;

export function HospitalEditor({
  hospital,
  treatments,
}: {
  hospital: Hospital | null;
  treatments: Treatment[];
}) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(saveHospitalAction, {});

  return (
    <form action={action} className="space-y-6">
      {hospital && <input type="hidden" name="id" value={hospital.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Hospital name</Label>
          <Input id="name" name="name" required defaultValue={hospital?.name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            required
            defaultValue={hospital?.city ?? ""}
            placeholder="Delhi NCR"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={hospital?.slug ?? ""}
          placeholder="Leave blank to generate from the name"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Accreditation</legend>
        <div className="flex flex-wrap gap-4">
          {ACCREDITATIONS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`accreditation_${code}`}
                defaultChecked={hospital?.accreditation.includes(code)}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              {code}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Only tick what the hospital actually holds — the badge is a trust claim.
        </p>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="specialties">Specialties (one per line)</Label>
        <Textarea
          id="specialties"
          name="specialties"
          defaultValue={hospital?.specialties.join("\n") ?? ""}
          placeholder={"Cardiac sciences\nOrthopaedics"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          name="about"
          defaultValue={hospital?.about ?? ""}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facilities">Facilities for international patients (one per line)</Label>
        <Textarea
          id="facilities"
          name="facilities"
          defaultValue={hospital?.facilities.join("\n") ?? ""}
          placeholder={"Dedicated international desk\nInterpreters"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="beds">Beds</Label>
          <Input id="beds" name="beds" type="number" min={0} defaultValue={hospital?.beds ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="established_year">Established</Label>
          <Input
            id="established_year"
            name="established_year"
            type="number"
            min={1800}
            max={2100}
            defaultValue={hospital?.established_year ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo_url">Photo URL</Label>
          <Input
            id="photo_url"
            name="photo_url"
            type="url"
            defaultValue={hospital?.photo_url ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intl_desk_contact">International desk contact (internal only)</Label>
        <Input
          id="intl_desk_contact"
          name="intl_desk_contact"
          defaultValue={hospital?.intl_desk_contact ?? ""}
          placeholder="name@hospital.example · +91 ..."
        />
        <p className="text-sm text-muted-foreground">
          Never shown on the public site. This is who your team calls to get a quote.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Treatments offered</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {treatments.map((treatment) => (
            <label key={treatment.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="treatment_slugs"
                value={treatment.slug}
                defaultChecked={hospital?.treatment_slugs.includes(treatment.slug)}
                className="mt-1 size-4 accent-[hsl(var(--primary))]"
              />
              <span>
                {treatment.name}
                <span className="block text-xs text-muted-foreground">{treatment.category}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {hospital ? "Save hospital" : "Create hospital"}
      </Button>
    </form>
  );
}
