"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveTreatmentAction, type AdminResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES, TREATMENT_CATEGORIES } from "@/lib/reference-data";
import type { Treatment } from "@/lib/types";

export function TreatmentEditor({ treatment }: { treatment: Treatment | null }) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(saveTreatmentAction, {});

  return (
    <form action={action} className="space-y-6">
      {treatment && <input type="hidden" name="id" value={treatment.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="treatment_name">Treatment name</Label>
          <Input
            id="treatment_name"
            name="name"
            required
            defaultValue={treatment?.name ?? ""}
            placeholder="Total knee replacement"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            required
            list="treatment-categories"
            defaultValue={treatment?.category ?? ""}
            placeholder="Orthopaedics"
          />
          <datalist id="treatment-categories">
            {TREATMENT_CATEGORIES.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment_slug">URL slug</Label>
        <Input
          id="treatment_slug"
          name="slug"
          defaultValue={treatment?.slug ?? ""}
          placeholder="Leave blank to generate from the name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short description (used on cards)</Label>
        <Textarea id="description" name="description" defaultValue={treatment?.description ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="overview">Overview — what the procedure involves</Label>
        <Textarea
          id="overview"
          name="overview"
          defaultValue={treatment?.overview ?? ""}
          className="min-h-[140px]"
        />
        <p className="text-sm text-muted-foreground">
          Write plainly. This is read by anxious people, often in a second language.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stay_summary">Typical stay</Label>
        <Input
          id="stay_summary"
          name="stay_summary"
          defaultValue={treatment?.stay_summary ?? ""}
          placeholder="4–5 days in hospital, about 3 weeks in India in total"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Indicative cost band in India (USD)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="indicative_cost_min">Minimum</Label>
            <Input
              id="indicative_cost_min"
              name="indicative_cost_min"
              type="number"
              min={0}
              step={100}
              required
              defaultValue={treatment?.indicative_cost_min ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="indicative_cost_max">Maximum</Label>
            <Input
              id="indicative_cost_max"
              name="indicative_cost_max"
              type="number"
              min={0}
              step={100}
              required
              defaultValue={treatment?.indicative_cost_max ?? 0}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Always published as a band, labelled indicative. Never presented as a quote.
        </p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Home-country reference costs (USD)</legend>
        <p className="text-sm text-muted-foreground">
          Used for the savings comparison. Leave a market blank and it is estimated from the United
          States figure. Source these from published data, not guesswork.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {COUNTRIES.filter((country) => country.code !== "OTHER").map((country) => (
            <div key={country.code} className="space-y-1">
              <Label htmlFor={`ref_${country.code}`} className="text-xs">
                {country.name}
              </Label>
              <Input
                id={`ref_${country.code}`}
                name={`ref_${country.code}`}
                type="number"
                min={0}
                step={100}
                className="h-10"
                defaultValue={treatment?.home_country_reference_costs?.[country.code] ?? ""}
              />
            </div>
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
        {treatment ? "Save treatment" : "Create treatment"}
      </Button>
    </form>
  );
}
