"use client";

import { useActionState } from "react";
import { FileUp, Loader2, Save } from "lucide-react";
import { updateProfileAction, type ActionResult } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/reference-data";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-limits";
import type { PatientProfile } from "@/lib/types";

export function ProfileForm({
  profile,
  fallbackName,
}: {
  profile: PatientProfile | null;
  fallbackName: string;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name (as in your passport)</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          defaultValue={profile?.full_name ?? fallbackName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" name="dob" type="date" defaultValue={profile?.dob ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Select id="nationality" name="nationality" defaultValue={profile?.nationality ?? ""}>
            <option value="">Select your nationality</option>
            {COUNTRIES.filter((country) => country.code !== "OTHER").map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
          <p className="text-sm text-muted-foreground">
            Your nationality decides which visa route applies.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passport_number">Passport number</Label>
        <Input
          id="passport_number"
          name="passport_number"
          defaultValue={profile?.passport_number ?? ""}
          placeholder="A01234567"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passport">Passport copy</Label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center hover:border-primary hover:bg-primary-subtle/40">
          <FileUp className="size-6 text-primary" aria-hidden="true" />
          <span className="font-medium">
            {profile?.passport_doc_url ? "Replace passport copy" : "Upload the photo page"}
          </span>
          <span className="text-sm text-muted-foreground">
            A clear photo or scan of the page with your photograph. PDF or image, up to 15 MB.
          </span>
          <input
            id="passport"
            type="file"
            name="passport"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
          />
        </label>
        {profile?.passport_doc_url && (
          <p className="text-sm text-success">
            A passport copy is on file. It is listed under Documents.
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save my details
      </Button>
    </form>
  );
}
