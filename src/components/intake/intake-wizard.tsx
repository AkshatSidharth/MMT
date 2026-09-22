"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { submitIntakeAction, type ActionResult } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyNote } from "@/components/site/trust";
import { COUNTRIES } from "@/lib/reference-data";
import { ACCEPT_ATTRIBUTE, formatBytes } from "@/lib/upload-limits";
import { formatUsdBand } from "@/lib/utils";
import type { Treatment } from "@/lib/types";

const STEPS = [
  "Treatment needed",
  "Medical records",
  "Travel window",
  "Who is travelling",
  "Review & submit",
];

const FLEXIBILITY_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "fixed", label: "These dates are fixed" },
  { value: "flexible_weeks", label: "Flexible by a couple of weeks" },
  { value: "flexible_month", label: "Flexible by a month or more" },
  { value: "unsure", label: "Not sure yet" },
];

export function IntakeWizard({
  treatments,
  initialTreatmentSlug,
  defaultName,
  defaultCountry,
}: {
  treatments: Treatment[];
  initialTreatmentSlug?: string;
  defaultName: string;
  defaultCountry: string;
}) {
  const [step, setStep] = useState(0);
  const [treatmentSlug, setTreatmentSlug] = useState(initialTreatmentSlug ?? "");
  const [diagnosis, setDiagnosis] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [addLater, setAddLater] = useState(false);
  const [travelFrom, setTravelFrom] = useState("");
  const [travelTo, setTravelTo] = useState("");
  const [flexibility, setFlexibility] = useState("flexible_weeks");
  const [attendants, setAttendants] = useState("1");
  const [homeCountry, setHomeCountry] = useState(defaultCountry);
  const [fullName, setFullName] = useState(defaultName);
  const [stepError, setStepError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    submitIntakeAction,
    {},
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    treatments.forEach((treatment) => {
      const list = map.get(treatment.category) ?? [];
      list.push(treatment);
      map.set(treatment.category, list);
    });
    return [...map.entries()];
  }, [treatments]);

  const selected = treatments.find((treatment) => treatment.slug === treatmentSlug);
  const country = COUNTRIES.find((item) => item.code === homeCountry);

  function validate(current: number) {
    if (current === 0) {
      if (!treatmentSlug) return "Choose the treatment you are looking for.";
      if (diagnosis.trim().length < 10) {
        return "Please describe your diagnosis or symptoms in a sentence or two.";
      }
    }
    if (current === 1 && files.length === 0 && !addLater) {
      return "Upload your reports, or tick the box to add them later.";
    }
    if (current === 2 && !flexibility) return "Tell us how flexible your dates are.";
    if (current === 3) {
      if (!homeCountry) return "Select the country you are travelling from.";
      if (fullName.trim().length < 2) return "Enter your full name.";
    }
    return null;
  }

  function next() {
    const error = validate(step);
    setStepError(error);
    if (!error) setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)].slice(0, 12));
    setAddLater(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-primary">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="text-sm text-muted-foreground">{STEPS[step]}</p>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <form
        action={formAction}
        onSubmit={(event) => {
          // Belt and braces: the wizard must only ever post from the last step.
          if (step !== STEPS.length - 1) event.preventDefault();
        }}
      >
        {/* The whole wizard posts once, so every answer travels with the submit. */}
        <input type="hidden" name="treatment_slug" value={treatmentSlug} />
        <input type="hidden" name="diagnosis_text" value={diagnosis} />
        <input type="hidden" name="travel_from" value={travelFrom} />
        <input type="hidden" name="travel_to" value={travelTo} />
        <input type="hidden" name="travel_flexibility" value={flexibility} />
        <input type="hidden" name="attendants_count" value={attendants} />
        <input type="hidden" name="home_country" value={homeCountry} />
        <input type="hidden" name="full_name" value={fullName} />

        <div className={step === 0 ? "space-y-5" : "hidden"}>
          <div className="space-y-2">
            <Label htmlFor="treatment">What treatment do you need?</Label>
            <Select
              id="treatment"
              value={treatmentSlug}
              onChange={(event) => setTreatmentSlug(event.target.value)}
            >
              <option value="">Select a treatment</option>
              {grouped.map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((treatment) => (
                    <option key={treatment.slug} value={treatment.slug}>
                      {treatment.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {selected && (
              <p className="text-sm text-muted-foreground">
                Indicative band in India:{" "}
                {formatUsdBand(selected.indicative_cost_min, selected.indicative_cost_max)}. Your
                quote is confirmed after a doctor reviews your case.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">
              What have you been diagnosed with, or what symptoms do you have?
            </Label>
            <Textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Write in your own words. For example: chest pain for six months, angiography in March showed three blocked arteries, doctor advised bypass surgery."
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground">
              Write as much or as little as you like — your case manager will ask for anything else
              that is needed.
            </p>
          </div>
        </div>

        <div className={step === 1 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold">Upload your existing medical records</h2>
            <p className="mt-1 text-muted-foreground">
              Discharge summaries, scan and lab reports, prescriptions. A clear photo taken on your
              phone is fine. Cases with reports attached get a doctor&apos;s opinion much faster.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:border-primary hover:bg-primary-subtle/40">
            <FileUp className="size-8 text-primary" aria-hidden="true" />
            <span className="font-medium">Choose files or take a photo</span>
            <span className="text-sm text-muted-foreground">
              PDF or image, up to 15 MB each. You can add up to 12 files.
            </span>
            <input
              type="file"
              name="records"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(event) => addFiles(event.target.files)}
            />
          </label>

          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm"
                >
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="rounded p-1 hover:bg-accent"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="flex items-start gap-3 rounded-md border p-4">
            <input
              type="checkbox"
              checked={addLater}
              onChange={(event) => {
                setAddLater(event.target.checked);
                setStepError(null);
              }}
              className="mt-1 size-4 accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="block font-medium">I&apos;ll add my reports later</span>
              <span className="block text-sm text-muted-foreground">
                You can upload them from your dashboard at any time. We will start work on your case
                either way.
              </span>
            </span>
          </label>

          <PrivacyNote />
        </div>

        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold">When would you like to travel?</h2>
            <p className="mt-1 text-muted-foreground">
              An approximate window is enough. We use it to check hospital and surgeon availability.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="travel_from_input">Earliest date</Label>
              <Input
                id="travel_from_input"
                type="date"
                value={travelFrom}
                onChange={(event) => setTravelFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travel_to_input">Latest date</Label>
              <Input
                id="travel_to_input"
                type="date"
                value={travelTo}
                onChange={(event) => setTravelTo(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="flexibility">How flexible are these dates?</Label>
            <Select
              id="flexibility"
              value={flexibility}
              onChange={(event) => setFlexibility(event.target.value)}
            >
              {FLEXIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={step === 3 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold">Who is travelling with you?</h2>
            <p className="mt-1 text-muted-foreground">
              India&apos;s e-Medical Visa allows up to two attendants to travel with a patient on
              linked attendant visas.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendants">Number of attendants</Label>
            <Select
              id="attendants"
              value={attendants}
              onChange={(event) => setAttendants(event.target.value)}
            >
              <option value="0">Travelling alone</option>
              <option value="1">1 attendant</option>
              <option value="2">2 attendants</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="home_country">Which country are you travelling from?</Label>
            <Select
              id="home_country"
              value={homeCountry}
              onChange={(event) => setHomeCountry(event.target.value)}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
            {country && !country.eMedicalVisa && (
              <p className="text-sm text-muted-foreground">
                We will confirm the right visa route for your nationality — not every country is
                covered by the e-Medical Visa scheme.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name_input">Your full name</Label>
            <Input
              id="full_name_input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="As written in your passport"
              autoComplete="name"
            />
          </div>
        </div>

        <div className={step === 4 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-lg font-semibold">Check your answers</h2>
            <p className="mt-1 text-muted-foreground">
              Submitting creates your case and puts it in front of a case manager. You can still
              change these details afterwards.
            </p>
          </div>
          <dl className="divide-y rounded-lg border">
            {[
              { label: "Treatment", value: selected?.name ?? "—" },
              { label: "Your description", value: diagnosis || "—" },
              {
                label: "Records attached",
                value: files.length > 0 ? `${files.length} file(s)` : "None yet — adding later",
              },
              {
                label: "Travel window",
                value:
                  travelFrom && travelTo ? `${travelFrom} to ${travelTo}` : "Not set",
              },
              {
                label: "Flexibility",
                value:
                  FLEXIBILITY_OPTIONS.find((option) => option.value === flexibility)?.label ?? "—",
              },
              { label: "Attendants", value: attendants },
              { label: "Travelling from", value: country?.name ?? "—" },
              { label: "Name", value: fullName || "—" },
            ].map((row) => (
              <div key={row.label} className="grid gap-1 p-4 sm:grid-cols-3">
                <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
                <dd className="sm:col-span-2 whitespace-pre-wrap">{row.value}</dd>
              </div>
            ))}
          </dl>
          <PrivacyNote />
        </div>

        {(stepError || state.error) && (
          <p role="alert" className="mt-5 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {stepError ?? state.error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            key="back"
            type="button"
            variant="ghost"
            onClick={() => {
              setStepError(null);
              setStep((value) => Math.max(value - 1, 0));
            }}
            disabled={step === 0 || pending}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button key="continue" type="button" size="lg" onClick={next}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button key="submit" type="submit" size="lg" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting your case
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit my case
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-8 flex items-start gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        Submitting costs nothing and does not commit you to treatment. There is no payment on this
        platform.
      </p>
    </div>
  );
}
