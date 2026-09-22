/** Core domain types. These mirror the Postgres schema in supabase/migrations. */

export type Role = "patient" | "admin";
export type Language = "en" | "ar" | "fr" | "bn";
export type KycStatus = "pending" | "verified";

export const CASE_STATUSES = [
  "submitted",
  "under_review",
  "hospitals_matched",
  "consultation_scheduled",
  "quote_ready",
  "travel_prep",
  "in_treatment",
  "aftercare",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  hospitals_matched: "Hospitals matched",
  consultation_scheduled: "Consultation scheduled",
  quote_ready: "Quote ready",
  travel_prep: "Travel prep",
  in_treatment: "In treatment",
  aftercare: "Aftercare",
};

/** What the patient should expect next at each stage. Drives the dashboard callout. */
export const CASE_NEXT_STEP: Record<CaseStatus, string> = {
  submitted:
    "Your case is in the queue. A case manager is being assigned and will review your records.",
  under_review:
    "Your case manager is reviewing your records and shortlisting hospitals. Adding any missing reports speeds this up.",
  hospitals_matched:
    "Review the matched hospitals and tell us which ones interest you. We are arranging your teleconsultation.",
  consultation_scheduled:
    "Join your teleconsultation at the scheduled time using the link on the Consultation page.",
  quote_ready:
    "Review your quote. When you are ready to proceed, indicate interest and we will prepare your visa invitation letter.",
  travel_prep:
    "Complete your visa application and confirm your travel dates. Your documents are on the Documents page.",
  in_treatment: "You are with the hospital team. Your case manager stays reachable in Messages.",
  aftercare:
    "Your discharge summary and follow-up plan are on the Documents page. Message us any time.",
};

export const DOCUMENT_TYPES = [
  "medical_record",
  "passport",
  "quote",
  "visa_letter",
  "treatment_plan",
  "discharge_summary",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  medical_record: "Medical record",
  passport: "Passport",
  quote: "Quote",
  visa_letter: "Visa invitation letter",
  treatment_plan: "Treatment plan",
  discharge_summary: "Discharge summary",
  other: "Other",
};

export const MATCH_STATUSES = ["proposed", "patient_interested", "declined", "confirmed"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  proposed: "Proposed by your case manager",
  patient_interested: "You indicated interest",
  declined: "Not proceeding",
  confirmed: "Confirmed",
};

export const LEAD_STAGES = ["new", "contacted", "qualified", "converted", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export type Accreditation = "NABH" | "JCI" | "NABL" | "ISO";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  full_name: string | null;
  language: Language;
  /** False until the user has picked a language on first sign-in. */
  language_chosen: boolean;
  created_at: string;
}

export interface PatientProfile {
  user_id: string;
  full_name: string | null;
  dob: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_doc_url: string | null;
  kyc_status: KycStatus;
  updated_at: string;
}

/** Reference costs for the same procedure in the patient's home country, in USD. */
export type HomeCountryReferenceCosts = Record<string, number>;

export interface Treatment {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  /** Longer copy for the treatment page: what the procedure involves. */
  overview: string | null;
  /** Typical inpatient + recovery duration, e.g. "5 days in hospital, 3 weeks in India". */
  stay_summary: string | null;
  indicative_cost_min: number;
  indicative_cost_max: number;
  home_country_reference_costs: HomeCountryReferenceCosts;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string;
  accreditation: Accreditation[];
  specialties: string[];
  about: string;
  facilities: string[];
  photo_url: string | null;
  beds: number | null;
  established_year: number | null;
  /** Admin-only. Never sent to a patient-facing page. */
  intl_desk_contact: string | null;
  /** Treatment slugs this hospital is listed as offering. */
  treatment_slugs: string[];
  created_at: string;
}

/** A hospital record with the admin-only fields stripped, for public pages. */
export type PublicHospital = Omit<Hospital, "intl_desk_contact">;

export interface Doctor {
  id: string;
  hospital_id: string;
  name: string;
  specialty: string;
  qualifications: string;
  years_experience: number;
  photo_url: string | null;
  created_at: string;
}

export interface MedicalCase {
  id: string;
  /** Short human-readable reference shown to the patient, e.g. MMT-2418. */
  reference: string;
  patient_id: string;
  treatment_id: string | null;
  diagnosis_text: string;
  travel_window: string;
  travel_flexibility: string;
  attendants_count: number;
  home_country: string;
  status: CaseStatus;
  assigned_admin_id: string | null;
  /** When locked, the patient can no longer edit the case details. */
  locked: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string | null;
  patient_id: string;
  type: DocumentType;
  title: string;
  /** Storage key. Resolved to a short-lived signed URL at render time. */
  file_url: string;
  file_size: number;
  content_type: string;
  uploaded_by: string;
  uploaded_by_role: Role;
  created_at: string;
}

export interface Match {
  id: string;
  case_id: string;
  hospital_id: string;
  quote_amount: number | null;
  quote_details: string | null;
  /** Consolidated line items: treatment, stay, follow-up, service fee. */
  quote_breakdown: QuoteLine[];
  status: MatchStatus;
  created_at: string;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Consultation {
  id: string;
  case_id: string;
  hospital_id: string | null;
  doctor_name: string;
  scheduled_at: string;
  join_link: string;
  notes: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  sender_id: string;
  sender_role: Role;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  treatment_interest: string | null;
  country: string | null;
  source: string;
  stage: LeadStage;
  notes: string | null;
  created_at: string;
}

/** A case joined with the rows the UI almost always needs alongside it. */
export interface CaseWithRelations extends MedicalCase {
  patient: User | null;
  profile: PatientProfile | null;
  treatment: Treatment | null;
  assigned_admin: User | null;
  documents: CaseDocument[];
  matches: (Match & { hospital: Hospital | null })[];
  consultation: Consultation | null;
  message_count: number;
}
