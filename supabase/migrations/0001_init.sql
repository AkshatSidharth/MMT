-- ---------------------------------------------------------------------------
-- Medical tourism facilitator — core schema, RLS and private storage buckets.
--
-- Operating model: patient-facing intake is automated; supply (hospitals,
-- doctors, treatments, cost bands) is reference content loaded by ops; and
-- fulfilment (matches, quotes, consultations) is written by admins only.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
create type public.user_role as enum ('patient', 'admin');
create type public.language_code as enum ('en', 'ar', 'fr', 'bn');
create type public.kyc_status as enum ('pending', 'verified');
create type public.case_status as enum (
  'submitted',
  'under_review',
  'hospitals_matched',
  'consultation_scheduled',
  'quote_ready',
  'travel_prep',
  'in_treatment',
  'aftercare'
);
create type public.document_type as enum (
  'medical_record',
  'passport',
  'quote',
  'visa_letter',
  'treatment_plan',
  'discharge_summary',
  'other'
);
create type public.match_status as enum ('proposed', 'patient_interested', 'declined', 'confirmed');
create type public.lead_stage as enum ('new', 'contacted', 'qualified', 'converted', 'lost');

-- Users ---------------------------------------------------------------------
-- Mirrors auth.users so we can attach a role, display name and language.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  phone text unique,
  role public.user_role not null default 'patient',
  full_name text,
  language public.language_code not null default 'en',
  -- False until the user picks a language on first sign-in.
  language_chosen boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.patient_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  full_name text,
  dob date,
  nationality text,
  passport_number text,
  passport_doc_url text,
  kyc_status public.kyc_status not null default 'pending',
  updated_at timestamptz not null default now()
);

-- Supply (reference content maintained by ops) -------------------------------
create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  overview text,
  stay_summary text,
  indicative_cost_min integer not null default 0,
  indicative_cost_max integer not null default 0,
  home_country_reference_costs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint treatments_cost_band_valid check (indicative_cost_max >= indicative_cost_min)
);

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  accreditation text[] not null default '{}',
  specialties text[] not null default '{}',
  about text not null default '',
  facilities text[] not null default '{}',
  photo_url text,
  beds integer,
  established_year integer,
  -- Admin-only column. The public policy below still exposes the row, so
  -- patient-facing queries must select explicit columns; server code strips it.
  intl_desk_contact text,
  treatment_slugs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  specialty text not null,
  qualifications text not null default '',
  years_experience integer not null default 0,
  photo_url text,
  created_at timestamptz not null default now()
);

create index doctors_hospital_id_idx on public.doctors (hospital_id);
create index hospitals_city_idx on public.hospitals (city);
create index hospitals_specialties_idx on public.hospitals using gin (specialties);
create index hospitals_treatment_slugs_idx on public.hospitals using gin (treatment_slugs);

-- Demand -------------------------------------------------------------------
create sequence public.case_reference_seq start 1003;

create table public.medical_cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_id uuid not null references public.users (id) on delete cascade,
  treatment_id uuid references public.treatments (id) on delete set null,
  diagnosis_text text not null default '',
  travel_window text not null default '',
  travel_flexibility text not null default '',
  attendants_count smallint not null default 0,
  home_country text not null default '',
  status public.case_status not null default 'submitted',
  assigned_admin_id uuid references public.users (id) on delete set null,
  locked boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_cases_attendants_range check (attendants_count between 0 and 2)
);

create index medical_cases_patient_id_idx on public.medical_cases (patient_id);
create index medical_cases_status_idx on public.medical_cases (status);

create or replace function public.set_case_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'MMT-' || nextval('public.case_reference_seq')::text;
  end if;
  return new;
end;
$$;

create trigger medical_cases_set_reference
before insert on public.medical_cases
for each row execute function public.set_case_reference();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.medical_cases (id) on delete cascade,
  patient_id uuid not null references public.users (id) on delete cascade,
  type public.document_type not null default 'other',
  title text not null default '',
  -- Storage key ("bucket/object"), resolved to a short-lived signed URL on read.
  file_url text not null,
  file_size integer not null default 0,
  content_type text not null default 'application/octet-stream',
  uploaded_by uuid not null references public.users (id) on delete cascade,
  uploaded_by_role public.user_role not null default 'patient',
  created_at timestamptz not null default now()
);

create index documents_case_id_idx on public.documents (case_id);
create index documents_patient_id_idx on public.documents (patient_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.medical_cases (id) on delete cascade,
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  quote_amount integer,
  quote_details text,
  quote_breakdown jsonb not null default '[]'::jsonb,
  status public.match_status not null default 'proposed',
  created_at timestamptz not null default now(),
  unique (case_id, hospital_id)
);

create index matches_case_id_idx on public.matches (case_id);

-- One consultation per case: the admin overwrites it when rescheduling.
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.medical_cases (id) on delete cascade,
  hospital_id uuid references public.hospitals (id) on delete set null,
  doctor_name text not null default '',
  scheduled_at timestamptz not null,
  join_link text not null default '',
  notes text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.medical_cases (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  sender_role public.user_role not null,
  sender_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_case_id_idx on public.messages (case_id, created_at);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  treatment_interest text,
  country text,
  source text not null default 'cost_estimator',
  stage public.lead_stage not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);

-- Helpers -------------------------------------------------------------------
-- SECURITY DEFINER so policies on public.users can call it without recursing
-- through that table's own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_case(target_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.medical_cases
    where id = target_case_id and patient_id = auth.uid()
  );
$$;

-- New auth user -> app user row (+ empty patient profile).
-- ADMIN_EMAILS is mirrored here as a Postgres setting so the very first ops
-- accounts come up as admins; afterwards roles are managed in the admin panel.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_emails text := coalesce(current_setting('app.admin_emails', true), '');
  resolved_role public.user_role := 'patient';
begin
  if new.email is not null and admin_emails <> '' then
    if position(lower(new.email) in lower(admin_emails)) > 0 then
      resolved_role := 'admin';
    end if;
  end if;

  insert into public.users (id, email, phone, full_name, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    resolved_role
  )
  on conflict (id) do nothing;

  insert into public.patient_profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Row level security --------------------------------------------------------
alter table public.users enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.treatments enable row level security;
alter table public.hospitals enable row level security;
alter table public.doctors enable row level security;
alter table public.medical_cases enable row level security;
alter table public.documents enable row level security;
alter table public.matches enable row level security;
alter table public.consultations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;

-- users: read and update your own row; admins see everyone. Role changes are
-- deliberately not grantable to patients.
create policy users_select_self on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid() and role = 'patient');
create policy users_admin_all on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- patient_profiles: patients own their profile, but KYC status is admin-only,
-- enforced by the trigger below rather than by the policy.
create policy profiles_select on public.patient_profiles
  for select using (user_id = auth.uid() or public.is_admin());
create policy profiles_insert on public.patient_profiles
  for insert with check (user_id = auth.uid() or public.is_admin());
create policy profiles_update on public.patient_profiles
  for update using (user_id = auth.uid() or public.is_admin());
create policy profiles_admin_delete on public.patient_profiles
  for delete using (public.is_admin());

create or replace function public.guard_kyc_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kyc_status <> old.kyc_status and not public.is_admin() then
    raise exception 'kyc_status is verified by staff only';
  end if;
  return new;
end;
$$;

create trigger patient_profiles_guard_kyc
before update on public.patient_profiles
for each row execute function public.guard_kyc_status();

-- Supply directory is public read, admin write.
create policy treatments_public_read on public.treatments for select using (true);
create policy treatments_admin_write on public.treatments
  for all using (public.is_admin()) with check (public.is_admin());

create policy hospitals_public_read on public.hospitals for select using (true);
create policy hospitals_admin_write on public.hospitals
  for all using (public.is_admin()) with check (public.is_admin());

create policy doctors_public_read on public.doctors for select using (true);
create policy doctors_admin_write on public.doctors
  for all using (public.is_admin()) with check (public.is_admin());

-- Cases: a patient sees only their own; only admins move status or assign.
create policy cases_select on public.medical_cases
  for select using (patient_id = auth.uid() or public.is_admin());
create policy cases_insert on public.medical_cases
  for insert with check (patient_id = auth.uid() or public.is_admin());
create policy cases_update_own on public.medical_cases
  for update using (patient_id = auth.uid() and not locked)
  with check (patient_id = auth.uid() and not locked);
create policy cases_admin_all on public.medical_cases
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.guard_case_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.assigned_admin_id is distinct from old.assigned_admin_id
     or new.locked is distinct from old.locked
     or new.admin_notes is distinct from old.admin_notes
     or new.reference is distinct from old.reference then
    raise exception 'case workflow fields are managed by staff only';
  end if;
  return new;
end;
$$;

create trigger medical_cases_guard_admin_fields
before update on public.medical_cases
for each row execute function public.guard_case_admin_fields();

-- Documents: patients read their own and upload records; admins do everything.
create policy documents_select on public.documents
  for select using (patient_id = auth.uid() or public.is_admin());
create policy documents_insert_own on public.documents
  for insert with check (
    (patient_id = auth.uid() and uploaded_by = auth.uid()
      and type in ('medical_record', 'passport', 'other'))
    or public.is_admin()
  );
create policy documents_delete_own on public.documents
  for delete using (
    (uploaded_by = auth.uid() and type in ('medical_record', 'passport', 'other'))
    or public.is_admin()
  );
create policy documents_admin_update on public.documents
  for update using (public.is_admin()) with check (public.is_admin());

-- Matches and quotes are authored by admins; the patient may only signal
-- interest, which is enforced by the trigger below.
create policy matches_select on public.matches
  for select using (public.owns_case(case_id) or public.is_admin());
create policy matches_admin_write on public.matches
  for all using (public.is_admin()) with check (public.is_admin());
create policy matches_patient_update on public.matches
  for update using (public.owns_case(case_id)) with check (public.owns_case(case_id));

create or replace function public.guard_match_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.quote_amount is distinct from old.quote_amount
     or new.quote_details is distinct from old.quote_details
     or new.quote_breakdown is distinct from old.quote_breakdown
     or new.hospital_id is distinct from old.hospital_id
     or new.case_id is distinct from old.case_id then
    raise exception 'quotes are issued by staff only';
  end if;
  if new.status not in ('patient_interested', 'declined', 'proposed') then
    raise exception 'invalid patient match status';
  end if;
  return new;
end;
$$;

create trigger matches_guard_fields
before update on public.matches
for each row execute function public.guard_match_fields();

-- Consultations: read-only for the patient, written by admins.
create policy consultations_select on public.consultations
  for select using (public.owns_case(case_id) or public.is_admin());
create policy consultations_admin_write on public.consultations
  for all using (public.is_admin()) with check (public.is_admin());

-- Messages: the 1:1 thread between patient and case manager.
create policy messages_select on public.messages
  for select using (public.owns_case(case_id) or public.is_admin());
create policy messages_insert on public.messages
  for insert with check (
    (public.owns_case(case_id) and sender_id = auth.uid() and sender_role = 'patient')
    or (public.is_admin() and sender_id = auth.uid())
  );

-- Leads are captured server-side and only ops reads them.
create policy leads_admin_all on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

-- Private storage -----------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('medical-records', 'medical-records', false),
  ('identity-docs', 'identity-docs', false),
  ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

-- Objects are addressed by an opaque uuid-prefixed key and are only ever
-- reached through a short-lived signed URL minted server-side after the
-- caller has been authorised against the owning document row.
create policy storage_admin_all on storage.objects
  for all
  using (bucket_id in ('medical-records', 'identity-docs', 'case-documents') and public.is_admin())
  with check (
    bucket_id in ('medical-records', 'identity-docs', 'case-documents') and public.is_admin()
  );

create policy storage_patient_read_own on storage.objects
  for select using (
    bucket_id in ('medical-records', 'identity-docs', 'case-documents')
    and exists (
      select 1 from public.documents
      where documents.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        and documents.patient_id = auth.uid()
    )
  );

create policy storage_patient_insert on storage.objects
  for insert with check (
    bucket_id in ('medical-records', 'identity-docs')
    and auth.uid() is not null
  );
