import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  DOCTOR_SEEDS,
  HOSPITAL_SEEDS,
  TREATMENTS_WITH_COSTS,
} from "@/lib/reference-data";
import type {
  CaseDocument,
  Consultation,
  Doctor,
  Hospital,
  Lead,
  Match,
  MedicalCase,
  Message,
  PatientProfile,
  Treatment,
  User,
} from "@/lib/types";

export interface OtpRecord {
  phone: string;
  code: string;
  expires_at: string;
}

export interface StoreShape {
  version: number;
  case_counter: number;
  users: User[];
  patient_profiles: PatientProfile[];
  treatments: Treatment[];
  hospitals: Hospital[];
  doctors: Doctor[];
  medical_cases: MedicalCase[];
  documents: CaseDocument[];
  matches: Match[];
  consultations: Consultation[];
  messages: Message[];
  leads: Lead[];
  otps: OtpRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const now = () => new Date().toISOString();
const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const daysAhead = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

function seed(): StoreShape {
  const treatments: Treatment[] = TREATMENTS_WITH_COSTS.map((treatment) => ({
    id: randomUUID(),
    name: treatment.name,
    slug: treatment.slug,
    category: treatment.category,
    description: treatment.description,
    overview: treatment.overview,
    stay_summary: treatment.stay_summary,
    indicative_cost_min: treatment.indicative_cost_min,
    indicative_cost_max: treatment.indicative_cost_max,
    home_country_reference_costs: treatment.home_country_reference_costs,
    created_at: now(),
  }));

  const hospitals: Hospital[] = HOSPITAL_SEEDS.map((hospital) => ({
    id: randomUUID(),
    name: hospital.name,
    slug: hospital.slug,
    city: hospital.city,
    accreditation: hospital.accreditation,
    specialties: hospital.specialties,
    about: hospital.about,
    facilities: hospital.facilities,
    photo_url: null,
    beds: hospital.beds,
    established_year: hospital.established_year,
    intl_desk_contact: hospital.intl_desk_contact,
    treatment_slugs: hospital.treatment_slugs,
    created_at: now(),
  }));

  const doctors: Doctor[] = DOCTOR_SEEDS.flatMap((doctor) => {
    const hospital = hospitals.find((item) => item.slug === doctor.hospital_slug);
    if (!hospital) return [];
    return [
      {
        id: randomUUID(),
        hospital_id: hospital.id,
        name: doctor.name,
        specialty: doctor.specialty,
        qualifications: doctor.qualifications,
        years_experience: doctor.years_experience,
        photo_url: null,
        created_at: now(),
      },
    ];
  });

  /**
   * Two internal case managers and a small amount of sample demand, so the
   * admin pipeline is reviewable before any real traffic arrives.
   */
  const admins: User[] = [
    {
      id: randomUUID(),
      email: "priya.nair@example.com",
      phone: "+919800000001",
      role: "admin",
      full_name: "Priya Nair",
      language: "en",
      language_chosen: true,
      created_at: daysAgo(120),
    },
    {
      id: randomUUID(),
      email: "omar.haddad@example.com",
      phone: "+919800000002",
      role: "admin",
      full_name: "Omar Haddad",
      language: "en",
      language_chosen: true,
      created_at: daysAgo(95),
    },
  ];

  const samplePatients: User[] = [
    {
      id: randomUUID(),
      email: "sample.aminata@example.com",
      phone: "+2348000000001",
      role: "patient",
      full_name: "Aminata Bello",
      language: "en",
      language_chosen: true,
      created_at: daysAgo(9),
    },
    {
      id: randomUUID(),
      email: "sample.rahim@example.com",
      phone: "+8801700000001",
      role: "patient",
      full_name: "Rahim Chowdhury",
      language: "bn",
      language_chosen: true,
      created_at: daysAgo(4),
    },
  ];

  const profiles: PatientProfile[] = [
    {
      user_id: samplePatients[0].id,
      full_name: "Aminata Bello",
      dob: "1968-04-11",
      nationality: "NG",
      passport_number: "A01234567",
      passport_doc_url: null,
      kyc_status: "verified",
      updated_at: daysAgo(7),
    },
    {
      user_id: samplePatients[1].id,
      full_name: "Rahim Chowdhury",
      dob: "1981-11-02",
      nationality: "BD",
      passport_number: null,
      passport_doc_url: null,
      kyc_status: "pending",
      updated_at: daysAgo(4),
    },
  ];

  const bypass = treatments.find((t) => t.slug === "heart-bypass-surgery")!;
  const knee = treatments.find((t) => t.slug === "knee-replacement")!;

  const cases: MedicalCase[] = [
    {
      id: randomUUID(),
      reference: "MMT-1001",
      patient_id: samplePatients[0].id,
      treatment_id: bypass.id,
      diagnosis_text:
        "Triple vessel disease diagnosed on angiography in Lagos. Advised bypass surgery. Diabetic for 12 years, on insulin.",
      travel_window: "2026-10-15 to 2026-11-15",
      travel_flexibility: "flexible_month",
      attendants_count: 1,
      home_country: "NG",
      status: "quote_ready",
      assigned_admin_id: admins[0].id,
      locked: false,
      admin_notes:
        "Angiography report received. Two hospitals shortlisted; Meridian quote issued. Awaiting patient decision.",
      created_at: daysAgo(9),
      updated_at: daysAgo(1),
    },
    {
      id: randomUUID(),
      reference: "MMT-1002",
      patient_id: samplePatients[1].id,
      treatment_id: knee.id,
      diagnosis_text:
        "Bilateral knee osteoarthritis, grade 4 on the right. Unable to climb stairs. X-rays uploaded.",
      travel_window: "2026-12-01 to 2026-12-20",
      travel_flexibility: "fixed",
      attendants_count: 2,
      home_country: "BD",
      status: "under_review",
      assigned_admin_id: admins[1].id,
      locked: false,
      admin_notes: null,
      created_at: daysAgo(4),
      updated_at: daysAgo(2),
    },
  ];

  const meridian = hospitals.find((h) => h.slug === "meridian-institute-of-medical-sciences")!;
  const sundarban = hospitals.find((h) => h.slug === "sundarban-general-hospital")!;

  const matches: Match[] = [
    {
      id: randomUUID(),
      case_id: cases[0].id,
      hospital_id: meridian.id,
      quote_amount: 9700,
      quote_details:
        "Covers CABG with 6 nights inpatient stay including 2 nights in ICU, surgeon and anaesthetist fees, implants, one follow-up review before departure, and our service fee. Excludes flights, accommodation outside the hospital, and treatment of unrelated conditions found during workup.",
      quote_breakdown: [
        { label: "Surgery and hospital stay (6 nights)", amount: 7800 },
        { label: "Pre-operative workup and cardiac review", amount: 650 },
        { label: "Post-discharge follow-up consultation", amount: 150 },
        { label: "Facilitation and case management fee", amount: 1100 },
      ],
      status: "proposed",
      created_at: daysAgo(2),
    },
    {
      id: randomUUID(),
      case_id: cases[0].id,
      hospital_id: sundarban.id,
      quote_amount: null,
      quote_details: "Awaiting the hospital's international desk response on the package price.",
      quote_breakdown: [],
      status: "proposed",
      created_at: daysAgo(2),
    },
  ];

  const consultations: Consultation[] = [
    {
      id: randomUUID(),
      case_id: cases[0].id,
      hospital_id: meridian.id,
      doctor_name: "Dr. A. Raghunathan, Cardiothoracic surgery",
      scheduled_at: daysAhead(3),
      join_link: "https://meet.example.com/mmt-1001-review",
      notes:
        "Please keep your angiography CD and latest HbA1c report to hand. The call runs about 20 minutes and an interpreter will join if you need one.",
      created_at: daysAgo(1),
    },
  ];

  const messages: Message[] = [
    {
      id: randomUUID(),
      case_id: cases[0].id,
      sender_id: admins[0].id,
      sender_role: "admin",
      sender_name: "Priya Nair",
      body: "Hello Aminata, I have your angiography report and have shared it with two cardiac units. I will come back to you with quotes within two working days.",
      created_at: daysAgo(6),
    },
    {
      id: randomUUID(),
      case_id: cases[0].id,
      sender_id: samplePatients[0].id,
      sender_role: "patient",
      sender_name: "Aminata Bello",
      body: "Thank you Priya. My son will travel with me. Does he need a separate visa?",
      created_at: daysAgo(5),
    },
    {
      id: randomUUID(),
      case_id: cases[0].id,
      sender_id: admins[0].id,
      sender_role: "admin",
      sender_name: "Priya Nair",
      body: "Yes, he applies for an e-Medical Attendant visa linked to your e-Medical visa. I will send you both invitation letters once the hospital is confirmed.",
      created_at: daysAgo(5),
    },
  ];

  const leads: Lead[] = [
    {
      id: randomUUID(),
      name: "Joseph Mwangi",
      email: "joseph.mwangi@example.com",
      phone: "+254700000001",
      treatment_interest: "knee-replacement",
      country: "KE",
      source: "cost_estimator",
      stage: "new",
      notes: null,
      created_at: daysAgo(1),
    },
    {
      id: randomUUID(),
      name: "Fatima Al Balushi",
      email: "fatima.b@example.com",
      phone: "+96890000001",
      treatment_interest: "ivf",
      country: "OM",
      source: "cost_estimator",
      stage: "contacted",
      notes: "Asked for Arabic-speaking coordinator. Called back on WhatsApp.",
      created_at: daysAgo(3),
    },
    {
      id: randomUUID(),
      name: "Daniel Okafor",
      email: "d.okafor@example.com",
      phone: "+2348000000045",
      treatment_interest: null,
      country: "NG",
      source: "contact_form",
      stage: "new",
      notes: "General enquiry about liver transplant for his father.",
      created_at: daysAgo(2),
    },
  ];

  return {
    version: 1,
    case_counter: 1002,
    users: [...admins, ...samplePatients],
    patient_profiles: profiles,
    treatments,
    hospitals,
    doctors,
    medical_cases: cases,
    documents: [],
    matches,
    consultations,
    messages,
    leads,
    otps: [],
  };
}

/**
 * Kept on `globalThis` so the store survives Next.js dev hot reloads, and
 * flushed to disk on write so it survives a server restart.
 */
const globalForStore = globalThis as unknown as { __mmtStore?: StoreShape };

function load(): StoreShape {
  if (globalForStore.__mmtStore) return globalForStore.__mmtStore;

  let store: StoreShape | undefined;
  try {
    if (fs.existsSync(STORE_PATH)) {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as StoreShape;
    }
  } catch {
    // A corrupt dev store should not take the app down; re-seed instead.
    store = undefined;
  }

  if (!store) {
    store = seed();
    globalForStore.__mmtStore = store;
    persist();
    return store;
  }

  globalForStore.__mmtStore = store;
  return store;
}

export function persist() {
  const store = globalForStore.__mmtStore;
  if (!store) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Read-only filesystem (for example a serverless build step): stay in memory.
  }
}

export function getStore(): StoreShape {
  return load();
}

/** Applies a mutation and flushes to disk. */
export function mutate<T>(fn: (store: StoreShape) => T): T {
  const store = load();
  const result = fn(store);
  persist();
  return result;
}

export function nextCaseReference(): string {
  return mutate((store) => {
    store.case_counter += 1;
    return `MMT-${store.case_counter}`;
  });
}

export function newId() {
  return randomUUID();
}

export function timestamp() {
  return now();
}
