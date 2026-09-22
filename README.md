# Mediva — medical tourism facilitator platform

A platform that connects international patients with accredited Indian hospitals.
Patients submit their case, upload their records and track progress; an internal
ops team reads the case, brokers the hospital relationship offline, and publishes
quotes, consultations and documents back to the patient's dashboard.

## The operating model this is built around

At launch there is **no hospital or doctor onboarded**, so the product is
deliberately shaped like this:

| Surface | Nature |
| --- | --- |
| **Public marketing & funnel** | Real and fully automated. Directory and cost data is *reference content* loaded by ops, labelled **indicative** everywhere it appears. |
| **Patient dashboard** | Real and fully automated: sign-up, intake, uploads, status, documents, messaging. |
| **Admin panel** | The fulfilment engine. Ops reads the case, contacts hospitals offline, and hand-populates matches, quotes, consultations and documents. |

There is **no live booking**: no doctor calendars, no real-time slots, no doctor
or hospital logins, no payments, and no automated matching. A person does the
matching and a person schedules every consultation. The UI says so out loud —
that honesty is the trust proposition, not a limitation to paper over.

## Tech stack

- **Next.js 15** (App Router, React 19, Server Actions) + **TypeScript**
- **Tailwind CSS** + shadcn/ui-style primitives (`src/components/ui`) + `lucide-react`
- **Supabase** — Postgres, Google + phone-OTP auth, private Storage buckets, RLS
- Deployable anywhere Next.js runs (Vercel recommended)

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

It runs with **no configuration**. Without Supabase credentials the app uses a
bundled local data layer (`src/lib/db/local-repo.ts`) that persists to
`.data/store.json` and stores uploads under `.data/uploads/`, seeded with the
reference catalogue plus a small amount of sample demand so both surfaces are
reviewable end to end. In that mode the sign-in page offers:

- **Continue with email** — stands in for Google OAuth (no provider configured)
- **Phone OTP** — the code is generated server-side and shown on screen
- **Demo shortcuts** — sign in as a seeded patient or as a case manager

Every one of these is labelled *development mode* in the UI so it cannot be
mistaken for the real thing.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed:sql` | Print INSERT statements for the supply catalogue |

## Connecting Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql`. It creates the schema, enums, RLS
   policies, the guard triggers, the `auth.users` → `public.users` trigger, and
   the three **private** storage buckets (`medical-records`, `identity-docs`,
   `case-documents`).
3. Seed the supply catalogue:
   ```bash
   npm run seed:sql > supabase/seed.generated.sql   # then run it against your project
   ```
4. Bootstrap your first ops accounts (they become `admin` on first sign-in):
   ```sql
   alter database postgres set app.admin_emails = 'ops@yourdomain.com';
   ```
   Mirror the same list in the `ADMIN_EMAILS` env var.
5. Enable the **Google** and **Phone** auth providers, and add
   `<site-url>/auth/callback` as an OAuth redirect URL.
6. Copy `.env.example` to `.env.local` and fill it in. The app switches to
   Supabase automatically as soon as `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present.

### How the two data layers coexist

Every read and write in the app goes through one interface, `Repo`
(`src/lib/db/repo.ts`), with two implementations selected at runtime in
`src/lib/db/index.ts`. Nothing in the UI or the server actions knows which one is
in use, so switching to Supabase is a configuration change, not a rewrite.

## Security model

- **Route gating** happens server-side in the `/dashboard` and `/admin` layouts
  (`requirePatient()` / `requireAdmin()`), not in middleware, because that is
  where the role is actually known.
- **RLS** (see the migration) is the second line: patients can read and write
  only their own rows; the supply directory is public-read and admin-write;
  quotes, consultations, case status, case assignment and KYC status are
  **admin-write only**, enforced by policies *and* by `BEFORE UPDATE` triggers so
  a patient cannot edit a field the UI merely hides.
- **Files** live in private buckets. Patients and admins reach them only through
  short-lived signed URLs (Supabase) or the authorising route handler
  `/api/files/[...key]` (local), which checks the requesting user against the
  document row that owns the object before streaming a byte.
- `intl_desk_contact` on hospitals is admin-only and never rendered on a
  patient-facing page.
- The service-role key is used only from server code that has already authorised
  the caller, and never reaches the browser.

## Layout

```
src/
  app/
    (public)/           marketing + funnel: home, treatments, hospitals, estimator, FAQ…
    (auth)/             sign-in, first-run language choice
    intake/             5-step intake wizard
    dashboard/          patient surface (case, quotes, consultation, documents, messages, KYC)
    admin/              ops surface (pipeline, supply CMS, case & quote builder)
    actions/            server actions: auth, cases, admin, leads, language
    api/files/[...key]  authorising download endpoint for private files
  components/{ui,site,dashboard,admin,intake,auth}
  lib/
    db/                 Repo interface + Supabase and local implementations
    types.ts            domain types mirroring the SQL schema
    reference-data.ts    the supply catalogue and country cost indices
    content.ts          static marketing copy (journey, FAQ)
supabase/migrations/    schema, RLS, triggers, storage policies
scripts/                seed-SQL generator
```

## Key flows

- **Lead capture** — cost estimator or contact form → `leads` row → visible in
  Admin › Pipeline. No account needed.
- **Case creation** — sign in → intake wizard → `medical_cases` row (status
  `submitted`) → appears in the pipeline.
- **Fulfilment** — admin reviews the case and records, verifies KYC, matches
  hospitals, builds a consolidated quote (the total is always the sum of the
  line items, so the headline figure and the breakdown cannot disagree),
  schedules the consultation by pasting the hospital's meeting link, issues
  documents, and messages the patient. Each action updates the patient's stepper.
- **Patient tracking** — one case manager, one message thread, one dashboard.

## Content and cost data

`src/lib/reference-data.ts` is the single source of truth shared by the local
store and the seed-SQL generator. The hospitals and doctors in it are
**illustrative composites, not real institutions or people** — deliberately so,
since publishing unverified specifics about a real hospital would be exactly the
kind of claim this product exists to avoid. Ops replaces them with vetted,
publicly sourced listings through Admin › Supply CMS.

Cost figures are indicative bands plus a per-country cost index used only for the
comparison. Every place they appear carries an "indicative, not a quotation"
note.

## Multilingual readiness

English is the only translated locale at launch. The header language switcher
stores the choice on the visitor's cookie and on their account, sets `lang` and
`dir` on `<html>`, and tells the user plainly that spoken support is available in
their language while page translation is in progress. Layout uses logical
properties (`ms-*`, `pe-*`, `start-*`, `end-*`) throughout so an RTL locale such
as Arabic flips correctly without a second stylesheet.

## Not built (phase 2, per the brief)

Standalone doctor pages (doctors currently appear on the hospital page), the
blog/SEO resource library, and the trip tracker (itinerary, airport pickup, FRRO
reminder). Payments, doctor and hospital portals, real-time booking and automated
matching are out of scope by design, not deferred.
