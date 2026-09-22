/**
 * Seed reference data for the supply directory.
 *
 * IMPORTANT: this is illustrative sample data so the platform is reviewable end
 * to end before real supply is loaded. The hospitals and doctors here are
 * composites, not real institutions or people. Ops replaces them through the
 * Admin > Supply CMS with vetted, publicly sourced listings. Every cost figure
 * is an indicative band, never a quoted price.
 */

import type { Accreditation, HomeCountryReferenceCosts } from "./types";

export interface CountryRef {
  code: string;
  name: string;
  /** Typical private-pay cost of a procedure relative to the United States (= 1.0). */
  costIndex: number;
  /** Eligible for India's e-Medical Visa (informational only). */
  eMedicalVisa: boolean;
}

/**
 * Cost indices are rough private-pay ratios used only to produce an indicative
 * comparison. In several of these markets the procedure is not available at all
 * locally, which is the usual reason patients travel.
 */
export const COUNTRIES: CountryRef[] = [
  { code: "US", name: "United States", costIndex: 1.0, eMedicalVisa: true },
  { code: "CA", name: "Canada", costIndex: 0.55, eMedicalVisa: true },
  { code: "GB", name: "United Kingdom", costIndex: 0.6, eMedicalVisa: true },
  { code: "AU", name: "Australia", costIndex: 0.62, eMedicalVisa: true },
  { code: "AE", name: "United Arab Emirates", costIndex: 0.45, eMedicalVisa: true },
  { code: "SA", name: "Saudi Arabia", costIndex: 0.4, eMedicalVisa: true },
  { code: "OM", name: "Oman", costIndex: 0.38, eMedicalVisa: true },
  { code: "IQ", name: "Iraq", costIndex: 0.3, eMedicalVisa: true },
  { code: "YE", name: "Yemen", costIndex: 0.24, eMedicalVisa: true },
  { code: "NG", name: "Nigeria", costIndex: 0.3, eMedicalVisa: true },
  { code: "KE", name: "Kenya", costIndex: 0.28, eMedicalVisa: true },
  { code: "TZ", name: "Tanzania", costIndex: 0.26, eMedicalVisa: true },
  { code: "ET", name: "Ethiopia", costIndex: 0.25, eMedicalVisa: true },
  { code: "SD", name: "Sudan", costIndex: 0.25, eMedicalVisa: true },
  { code: "BD", name: "Bangladesh", costIndex: 0.22, eMedicalVisa: true },
  { code: "NP", name: "Nepal", costIndex: 0.2, eMedicalVisa: false },
  { code: "LK", name: "Sri Lanka", costIndex: 0.22, eMedicalVisa: true },
  { code: "MV", name: "Maldives", costIndex: 0.35, eMedicalVisa: true },
  { code: "UZ", name: "Uzbekistan", costIndex: 0.28, eMedicalVisa: true },
  { code: "AF", name: "Afghanistan", costIndex: 0.22, eMedicalVisa: true },
  { code: "FJ", name: "Fiji", costIndex: 0.3, eMedicalVisa: true },
  { code: "OTHER", name: "Other country", costIndex: 0.35, eMedicalVisa: false },
];

export function countryByCode(code: string | null | undefined) {
  if (!code) return undefined;
  return COUNTRIES.find((country) => country.code === code);
}

export function countryName(code: string | null | undefined) {
  return countryByCode(code)?.name ?? code ?? "—";
}

/** Markets we publish a side-by-side comparison for on the treatment pages. */
const COMPARISON_MARKETS = ["US", "GB", "AE", "NG", "KE", "BD", "OM", "AU"];

function referenceCosts(usReference: number): HomeCountryReferenceCosts {
  const entries = COUNTRIES.filter((country) => COMPARISON_MARKETS.includes(country.code)).map(
    (country) => [country.code, Math.round((usReference * country.costIndex) / 100) * 100] as const,
  );
  return Object.fromEntries(entries);
}

/** Estimated home-country cost for any supported country, derived from the US reference. */
export function estimateHomeCountryCost(
  costs: HomeCountryReferenceCosts,
  countryCode: string,
): number | null {
  const direct = costs[countryCode];
  if (typeof direct === "number") return direct;
  const us = costs.US;
  const country = countryByCode(countryCode);
  if (typeof us !== "number" || !country) return null;
  return Math.round((us * country.costIndex) / 100) * 100;
}

export interface TreatmentSeed {
  name: string;
  slug: string;
  category: string;
  description: string;
  overview: string;
  stay_summary: string;
  indicative_cost_min: number;
  indicative_cost_max: number;
  us_reference: number;
}

export const TREATMENT_CATEGORIES = [
  "Cardiac sciences",
  "Orthopaedics",
  "Oncology",
  "Transplants",
  "Neurosciences",
  "Fertility",
  "Bariatrics",
  "Ophthalmology",
];

export const TREATMENT_SEEDS: TreatmentSeed[] = [
  {
    name: "Coronary artery bypass (CABG)",
    slug: "heart-bypass-surgery",
    category: "Cardiac sciences",
    description:
      "Open-heart surgery that restores blood flow by grafting healthy vessels around blocked coronary arteries.",
    overview:
      "A coronary artery bypass graft is used when one or more coronary arteries are narrowed enough to threaten the heart muscle. Surgeons take a healthy blood vessel, usually from the leg or chest, and graft it past the blockage so blood reaches the heart again. Most international patients are admitted a day before surgery for pre-operative workup, spend two to three days in intensive care, and are reviewed once more before flying home.",
    stay_summary: "6–8 days in hospital, about 3 weeks in India in total",
    indicative_cost_min: 5500,
    indicative_cost_max: 9500,
    us_reference: 120000,
  },
  {
    name: "Heart valve replacement",
    slug: "heart-valve-replacement",
    category: "Cardiac sciences",
    description:
      "Replacement of a narrowed or leaking heart valve with a mechanical or tissue valve.",
    overview:
      "Valve replacement is offered when a diseased aortic or mitral valve begins to strain the heart. Depending on age and lifestyle, the team will recommend either a mechanical valve, which lasts longer but needs lifelong blood thinners, or a tissue valve. Minimally invasive approaches are available at several of the units we work with.",
    stay_summary: "7–9 days in hospital, about 3–4 weeks in India in total",
    indicative_cost_min: 6000,
    indicative_cost_max: 11000,
    us_reference: 170000,
  },
  {
    name: "Angioplasty with stent",
    slug: "coronary-angioplasty",
    category: "Cardiac sciences",
    description:
      "A catheter procedure that opens a blocked coronary artery and holds it open with a stent.",
    overview:
      "Angioplasty is done through a small puncture in the wrist or groin, so there is no open surgery and recovery is quick. The cardiologist inflates a tiny balloon inside the narrowed artery and leaves a drug-eluting stent in place. Costs vary mostly with the number and type of stents used, which is why the final quote follows the consultation.",
    stay_summary: "2–3 days in hospital, about 10 days in India in total",
    indicative_cost_min: 3000,
    indicative_cost_max: 6500,
    us_reference: 57000,
  },
  {
    name: "Total knee replacement",
    slug: "knee-replacement",
    category: "Orthopaedics",
    description:
      "Resurfacing of a worn knee joint with an implant, to relieve arthritis pain and restore movement.",
    overview:
      "Knee replacement is recommended when arthritis has worn the joint surfaces to the point that walking is limited and medication no longer helps. The damaged surfaces are replaced with metal and polyethylene components. Implant brand and whether one or both knees are done in the same admission are the biggest drivers of cost, and physiotherapy starts the day after surgery.",
    stay_summary: "4–5 days in hospital, about 3 weeks in India in total",
    indicative_cost_min: 4000,
    indicative_cost_max: 7500,
    us_reference: 50000,
  },
  {
    name: "Total hip replacement",
    slug: "hip-replacement",
    category: "Orthopaedics",
    description: "Replacement of a damaged hip joint with a prosthetic socket and stem.",
    overview:
      "Hip replacement is used for advanced arthritis, avascular necrosis, or a badly healed fracture. The surgeon replaces the ball and socket with a prosthesis; ceramic-on-ceramic and metal-on-polyethylene options carry different costs and lifespans. Patients are usually walking with support within two days.",
    stay_summary: "4–6 days in hospital, about 3 weeks in India in total",
    indicative_cost_min: 4500,
    indicative_cost_max: 8500,
    us_reference: 55000,
  },
  {
    name: "Spinal fusion",
    slug: "spinal-fusion",
    category: "Orthopaedics",
    description:
      "Surgery that permanently joins two or more vertebrae to stop painful movement and correct instability.",
    overview:
      "Spinal fusion is considered for degenerative disc disease, spondylolisthesis, or deformity that has not responded to conservative care. Bone graft and instrumentation hold the segment while it fuses. The number of levels fused changes both the theatre time and the quote substantially.",
    stay_summary: "5–7 days in hospital, about 4 weeks in India in total",
    indicative_cost_min: 5500,
    indicative_cost_max: 11000,
    us_reference: 100000,
  },
  {
    name: "Liver transplant (living donor)",
    slug: "liver-transplant",
    category: "Transplants",
    description:
      "Transplant of a portion of a living donor's liver into a recipient with end-stage liver disease.",
    overview:
      "Living-donor liver transplant is a two-team operation on donor and recipient, and it is the most involved programme we broker. Indian law requires the donor to be a near relative, with documented consent and clearance from a hospital authorisation committee. Expect four to six weeks of workup, surgery and monitoring in India, and lifelong immunosuppression afterwards. Cases are accepted only after the hospital transplant team reviews the full record.",
    stay_summary: "3–4 weeks in hospital, 6–8 weeks in India in total",
    indicative_cost_min: 28000,
    indicative_cost_max: 45000,
    us_reference: 500000,
  },
  {
    name: "Kidney transplant",
    slug: "kidney-transplant",
    category: "Transplants",
    description: "Transplant of a healthy kidney from a related living donor.",
    overview:
      "A kidney transplant frees a patient from dialysis when kidney failure is advanced. As with liver transplant, the donor must be a near relative under Indian law and both donor and recipient are worked up and cleared by a hospital authorisation committee before a date is offered. Tissue matching is the first step, and it is done before any travel is booked.",
    stay_summary: "2–3 weeks in hospital, 5–6 weeks in India in total",
    indicative_cost_min: 13000,
    indicative_cost_max: 22000,
    us_reference: 440000,
  },
  {
    name: "Bone marrow transplant",
    slug: "bone-marrow-transplant",
    category: "Oncology",
    description:
      "Replacement of diseased bone marrow with healthy stem cells, for leukaemia, lymphoma and thalassaemia.",
    overview:
      "Bone marrow transplant can be autologous, using the patient's own stem cells, or allogeneic, using a matched donor. Allogeneic transplants need a donor search and carry a longer isolation period, which is reflected in both the stay and the cost. Paediatric thalassaemia transplants are among the most common cases we see from the Gulf and East Africa.",
    stay_summary: "4–6 weeks in hospital, 3 months in India in total",
    indicative_cost_min: 22000,
    indicative_cost_max: 40000,
    us_reference: 400000,
  },
  {
    name: "Cancer care package (chemotherapy & radiotherapy)",
    slug: "cancer-treatment",
    category: "Oncology",
    description:
      "Multi-disciplinary oncology care combining surgery, chemotherapy and image-guided radiotherapy.",
    overview:
      "Cancer quotes depend more on the protocol than on the hospital: stage, tumour board plan, number of chemotherapy cycles and whether radiotherapy is conformal or intensity-modulated. We ask for biopsy and imaging reports up front so the tumour board can give a realistic estimate rather than a headline figure.",
    stay_summary: "Varies by protocol; typically 4–8 weeks in India per phase",
    indicative_cost_min: 5000,
    indicative_cost_max: 30000,
    us_reference: 150000,
  },
  {
    name: "Brain tumour surgery",
    slug: "brain-tumour-surgery",
    category: "Neurosciences",
    description:
      "Neurosurgical removal of a brain tumour, often with intra-operative navigation and monitoring.",
    overview:
      "Craniotomy for tumour removal is planned from recent MRI imaging. Units we list use neuro-navigation and, for tumours near speech or motor areas, intra-operative monitoring or awake craniotomy. Histopathology after surgery determines whether radiotherapy or chemotherapy follows, so the first quote covers surgery and the inpatient stay.",
    stay_summary: "7–10 days in hospital, about 4 weeks in India in total",
    indicative_cost_min: 6000,
    indicative_cost_max: 12000,
    us_reference: 130000,
  },
  {
    name: "IVF cycle",
    slug: "ivf",
    category: "Fertility",
    description: "One in-vitro fertilisation cycle, including monitoring, retrieval and transfer.",
    overview:
      "A standard IVF cycle runs about three weeks from stimulation to embryo transfer. Medication response varies, so quotes list the cycle and the drugs separately. ICSI, embryo freezing and pre-implantation genetic testing are priced as add-ons. Indian law restricts commercial surrogacy and donor arrangements; our team explains what is and is not permitted before you travel.",
    stay_summary: "No inpatient stay; about 3 weeks in India per cycle",
    indicative_cost_min: 3000,
    indicative_cost_max: 6000,
    us_reference: 20000,
  },
  {
    name: "Bariatric surgery (sleeve gastrectomy)",
    slug: "bariatric-surgery",
    category: "Bariatrics",
    description:
      "Laparoscopic weight-loss surgery that reduces stomach volume to treat obesity and related disease.",
    overview:
      "Sleeve gastrectomy is done laparoscopically and is usually chosen for a BMI above 35 with conditions such as diabetes or sleep apnoea. Pre-operative workup includes endoscopy and an anaesthetic review. Follow-up nutrition support continues for a year, and your case manager keeps that thread open after you fly home.",
    stay_summary: "3–4 days in hospital, about 2 weeks in India in total",
    indicative_cost_min: 4500,
    indicative_cost_max: 7500,
    us_reference: 26000,
  },
  {
    name: "Cataract surgery with premium lens",
    slug: "cataract-surgery",
    category: "Ophthalmology",
    description: "Day-care removal of a clouded lens, replaced with a monofocal or multifocal lens.",
    overview:
      "Cataract surgery is a day-care procedure taking about twenty minutes per eye, with phacoemulsification and a foldable intraocular lens. Lens choice, monofocal through to trifocal or toric, is the main cost variable. Both eyes are often done a few days apart in the same trip.",
    stay_summary: "Day care; about 1 week in India for both eyes",
    indicative_cost_min: 700,
    indicative_cost_max: 2200,
    us_reference: 7000,
  },
];

export const TREATMENTS_WITH_COSTS = TREATMENT_SEEDS.map((treatment) => ({
  ...treatment,
  home_country_reference_costs: referenceCosts(treatment.us_reference),
}));

export interface HospitalSeed {
  name: string;
  slug: string;
  city: string;
  accreditation: Accreditation[];
  specialties: string[];
  about: string;
  facilities: string[];
  beds: number;
  established_year: number;
  intl_desk_contact: string;
  treatment_slugs: string[];
}

export const CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Kolkata",
  "Ahmedabad",
  "Kochi",
];

export const HOSPITAL_SEEDS: HospitalSeed[] = [
  {
    name: "Meridian Institute of Medical Sciences",
    slug: "meridian-institute-of-medical-sciences",
    city: "Delhi NCR",
    accreditation: ["NABH", "JCI"],
    specialties: ["Cardiac sciences", "Transplants", "Oncology", "Neurosciences"],
    about:
      "A 900-bed quaternary care hospital in the National Capital Region with a dedicated international patient floor, on-site guest accommodation for attendants, and interpreters for Arabic, French, Swahili and Bengali.",
    facilities: [
      "Dedicated international patient desk",
      "Airport pickup and visa letter support",
      "Attendant accommodation on campus",
      "Arabic, French, Swahili and Bengali interpreters",
      "24x7 cardiac catheterisation lab",
      "Halal and vegetarian kitchens",
    ],
    beds: 900,
    established_year: 1998,
    intl_desk_contact: "intl.desk@meridian-sample.example · +91 11 4000 0001",
    treatment_slugs: [
      "heart-bypass-surgery",
      "heart-valve-replacement",
      "coronary-angioplasty",
      "liver-transplant",
      "kidney-transplant",
      "bone-marrow-transplant",
      "cancer-treatment",
      "brain-tumour-surgery",
    ],
  },
  {
    name: "Harbourline Multispeciality Hospital",
    slug: "harbourline-multispeciality-hospital",
    city: "Mumbai",
    accreditation: ["NABH", "JCI", "NABL"],
    specialties: ["Oncology", "Orthopaedics", "Bariatrics", "Cardiac sciences"],
    about:
      "A 620-bed tertiary hospital in central Mumbai known for its tumour board model, where every oncology case is reviewed by a panel of surgical, medical and radiation oncologists before a plan is issued.",
    facilities: [
      "Multi-disciplinary tumour board",
      "Robotic surgery suite",
      "International patient lounge",
      "Long-stay serviced apartments nearby",
      "Onsite PET-CT",
    ],
    beds: 620,
    established_year: 2004,
    intl_desk_contact: "international@harbourline-sample.example · +91 22 4000 0002",
    treatment_slugs: [
      "cancer-treatment",
      "bone-marrow-transplant",
      "knee-replacement",
      "hip-replacement",
      "bariatric-surgery",
      "heart-bypass-surgery",
      "coronary-angioplasty",
    ],
  },
  {
    name: "Coromandel Heart & Transplant Centre",
    slug: "coromandel-heart-and-transplant-centre",
    city: "Chennai",
    accreditation: ["NABH", "JCI"],
    specialties: ["Cardiac sciences", "Transplants"],
    about:
      "A cardiac and abdominal transplant centre with 450 beds, a high-volume paediatric cardiac programme, and a transplant coordination team that handles donor documentation for international families.",
    facilities: [
      "Paediatric cardiac ICU",
      "Living-donor transplant coordination",
      "ECMO and mechanical circulatory support",
      "Transplant authorisation committee support",
      "Interpreter desk",
    ],
    beds: 450,
    established_year: 1992,
    intl_desk_contact: "care@coromandel-sample.example · +91 44 4000 0003",
    treatment_slugs: [
      "heart-bypass-surgery",
      "heart-valve-replacement",
      "coronary-angioplasty",
      "liver-transplant",
      "kidney-transplant",
    ],
  },
  {
    name: "Deccan Orthopaedic & Spine Institute",
    slug: "deccan-orthopaedic-and-spine-institute",
    city: "Hyderabad",
    accreditation: ["NABH"],
    specialties: ["Orthopaedics", "Neurosciences"],
    about:
      "A 280-bed joint replacement and spine hospital running a computer-navigated arthroplasty programme and an in-house rehabilitation gym, with physiotherapy from day one after surgery.",
    facilities: [
      "Computer-navigated joint replacement",
      "In-house rehabilitation gymnasium",
      "Laminar-flow orthopaedic theatres",
      "Wheelchair-accessible guest rooms",
    ],
    beds: 280,
    established_year: 2009,
    intl_desk_contact: "intl@deccan-sample.example · +91 40 4000 0004",
    treatment_slugs: ["knee-replacement", "hip-replacement", "spinal-fusion"],
  },
  {
    name: "Nilgiri Cancer Institute",
    slug: "nilgiri-cancer-institute",
    city: "Bengaluru",
    accreditation: ["NABH", "NABL"],
    specialties: ["Oncology"],
    about:
      "A dedicated 350-bed cancer hospital with intensity-modulated and image-guided radiotherapy, a bone marrow transplant unit, and a paediatric oncology day-care wing.",
    facilities: [
      "Image-guided radiotherapy",
      "Bone marrow transplant unit with HEPA isolation",
      "Paediatric oncology day care",
      "Onsite molecular pathology",
      "Patient and family counselling",
    ],
    beds: 350,
    established_year: 2011,
    intl_desk_contact: "global@nilgiri-sample.example · +91 80 4000 0005",
    treatment_slugs: ["cancer-treatment", "bone-marrow-transplant", "brain-tumour-surgery"],
  },
  {
    name: "Sundarban General Hospital",
    slug: "sundarban-general-hospital",
    city: "Kolkata",
    accreditation: ["NABH"],
    specialties: ["Cardiac sciences", "Orthopaedics", "Ophthalmology", "Bariatrics"],
    about:
      "A 400-bed general hospital that treats a large share of patients from Bangladesh and Nepal, with Bengali-speaking coordinators and a fixed-package model for common procedures.",
    facilities: [
      "Bengali and Nepali speaking coordinators",
      "Fixed-price surgical packages",
      "Day-care eye surgery theatre",
      "Budget attendant accommodation",
    ],
    beds: 400,
    established_year: 2001,
    intl_desk_contact: "intl@sundarban-sample.example · +91 33 4000 0006",
    treatment_slugs: [
      "coronary-angioplasty",
      "heart-bypass-surgery",
      "knee-replacement",
      "cataract-surgery",
      "bariatric-surgery",
    ],
  },
  {
    name: "Sabarmati Fertility & Women's Health Centre",
    slug: "sabarmati-fertility-and-womens-health-centre",
    city: "Ahmedabad",
    accreditation: ["NABH"],
    specialties: ["Fertility"],
    about:
      "A 90-bed fertility and women's health centre with an on-site embryology laboratory and a counselling-first approach, treating couples from across the Gulf and East Africa.",
    facilities: [
      "On-site embryology laboratory",
      "Embryo and oocyte cryopreservation",
      "Fertility counselling in English and Arabic",
      "Single-cycle transparent pricing",
    ],
    beds: 90,
    established_year: 2014,
    intl_desk_contact: "ivf.intl@sabarmati-sample.example · +91 79 4000 0007",
    treatment_slugs: ["ivf"],
  },
  {
    name: "Backwater Eye & Vision Hospital",
    slug: "backwater-eye-and-vision-hospital",
    city: "Kochi",
    accreditation: ["NABH"],
    specialties: ["Ophthalmology"],
    about:
      "A 120-bed eye hospital running high-volume cataract and refractive surgery lists, with premium intraocular lens options and same-week scheduling for both eyes.",
    facilities: [
      "Day-care cataract theatres",
      "Premium and toric lens options",
      "Retina and glaucoma clinics",
      "Airport transfer included in packages",
    ],
    beds: 120,
    established_year: 2007,
    intl_desk_contact: "vision@backwater-sample.example · +91 484 400 0008",
    treatment_slugs: ["cataract-surgery"],
  },
  {
    name: "Aravalli Neurosciences Hospital",
    slug: "aravalli-neurosciences-hospital",
    city: "Delhi NCR",
    accreditation: ["NABH", "JCI"],
    specialties: ["Neurosciences", "Orthopaedics"],
    about:
      "A 240-bed neurosciences hospital with neuro-navigation, awake craniotomy capability, and a stroke unit that also takes complex spine referrals from across South Asia.",
    facilities: [
      "Intra-operative neuro-navigation",
      "Awake craniotomy programme",
      "Comprehensive stroke unit",
      "Neuro-rehabilitation ward",
    ],
    beds: 240,
    established_year: 2012,
    intl_desk_contact: "neuro.intl@aravalli-sample.example · +91 124 400 0009",
    treatment_slugs: ["brain-tumour-surgery", "spinal-fusion"],
  },
  {
    name: "Western Ghats Liver & Digestive Institute",
    slug: "western-ghats-liver-and-digestive-institute",
    city: "Mumbai",
    accreditation: ["NABH", "JCI"],
    specialties: ["Transplants", "Bariatrics"],
    about:
      "A 200-bed hepatobiliary and transplant institute with a dedicated living-donor liver programme, a paediatric transplant unit, and post-transplant follow-up by teleconsultation.",
    facilities: [
      "Living-donor liver transplant programme",
      "Paediatric transplant unit",
      "Hepatology day-care clinic",
      "Post-transplant teleconsultation follow-up",
    ],
    beds: 200,
    established_year: 2010,
    intl_desk_contact: "transplant@westernghats-sample.example · +91 22 4000 0010",
    treatment_slugs: ["liver-transplant", "kidney-transplant", "bariatric-surgery"],
  },
];

export interface DoctorSeed {
  hospital_slug: string;
  name: string;
  specialty: string;
  qualifications: string;
  years_experience: number;
}

export const DOCTOR_SEEDS: DoctorSeed[] = [
  {
    hospital_slug: "meridian-institute-of-medical-sciences",
    name: "Dr. A. Raghunathan",
    specialty: "Cardiothoracic surgery",
    qualifications: "MBBS, MS, MCh (Cardiothoracic)",
    years_experience: 26,
  },
  {
    hospital_slug: "meridian-institute-of-medical-sciences",
    name: "Dr. Meera Kulkarni",
    specialty: "Interventional cardiology",
    qualifications: "MBBS, MD, DM (Cardiology)",
    years_experience: 18,
  },
  {
    hospital_slug: "meridian-institute-of-medical-sciences",
    name: "Dr. Samuel Thomas",
    specialty: "Hepatobiliary and transplant surgery",
    qualifications: "MBBS, MS, Fellowship in Liver Transplant",
    years_experience: 21,
  },
  {
    hospital_slug: "meridian-institute-of-medical-sciences",
    name: "Dr. Farah Siddiqui",
    specialty: "Medical oncology",
    qualifications: "MBBS, MD, DM (Medical Oncology)",
    years_experience: 15,
  },
  {
    hospital_slug: "harbourline-multispeciality-hospital",
    name: "Dr. Rohan Desai",
    specialty: "Surgical oncology",
    qualifications: "MBBS, MS, MCh (Surgical Oncology)",
    years_experience: 19,
  },
  {
    hospital_slug: "harbourline-multispeciality-hospital",
    name: "Dr. Kavita Menon",
    specialty: "Radiation oncology",
    qualifications: "MBBS, MD (Radiotherapy)",
    years_experience: 16,
  },
  {
    hospital_slug: "harbourline-multispeciality-hospital",
    name: "Dr. Imran Qureshi",
    specialty: "Bariatric and metabolic surgery",
    qualifications: "MBBS, MS, FALS (Bariatrics)",
    years_experience: 14,
  },
  {
    hospital_slug: "harbourline-multispeciality-hospital",
    name: "Dr. Anjali Bose",
    specialty: "Joint replacement surgery",
    qualifications: "MBBS, MS (Orthopaedics), Fellowship in Arthroplasty",
    years_experience: 17,
  },
  {
    hospital_slug: "coromandel-heart-and-transplant-centre",
    name: "Dr. V. Srinivasan",
    specialty: "Paediatric cardiac surgery",
    qualifications: "MBBS, MS, MCh, Fellowship in Paediatric Cardiac Surgery",
    years_experience: 24,
  },
  {
    hospital_slug: "coromandel-heart-and-transplant-centre",
    name: "Dr. Lakshmi Narayanan",
    specialty: "Cardiology",
    qualifications: "MBBS, MD, DM (Cardiology)",
    years_experience: 20,
  },
  {
    hospital_slug: "coromandel-heart-and-transplant-centre",
    name: "Dr. Paul Mathew",
    specialty: "Renal transplant surgery",
    qualifications: "MBBS, MS, MCh (Urology)",
    years_experience: 22,
  },
  {
    hospital_slug: "deccan-orthopaedic-and-spine-institute",
    name: "Dr. Suresh Reddy",
    specialty: "Knee and hip arthroplasty",
    qualifications: "MBBS, MS (Orthopaedics), Fellowship in Joint Replacement",
    years_experience: 23,
  },
  {
    hospital_slug: "deccan-orthopaedic-and-spine-institute",
    name: "Dr. Nandita Rao",
    specialty: "Spine surgery",
    qualifications: "MBBS, MS, Fellowship in Spine Surgery",
    years_experience: 15,
  },
  {
    hospital_slug: "deccan-orthopaedic-and-spine-institute",
    name: "Dr. Hari Prasad",
    specialty: "Sports and trauma orthopaedics",
    qualifications: "MBBS, DNB (Orthopaedics)",
    years_experience: 12,
  },
  {
    hospital_slug: "nilgiri-cancer-institute",
    name: "Dr. Shalini Gupta",
    specialty: "Haemato-oncology and bone marrow transplant",
    qualifications: "MBBS, MD, DM (Clinical Haematology)",
    years_experience: 18,
  },
  {
    hospital_slug: "nilgiri-cancer-institute",
    name: "Dr. Joseph D'Souza",
    specialty: "Paediatric oncology",
    qualifications: "MBBS, MD, Fellowship in Paediatric Haemato-Oncology",
    years_experience: 14,
  },
  {
    hospital_slug: "nilgiri-cancer-institute",
    name: "Dr. Ritu Saxena",
    specialty: "Neuro-oncology",
    qualifications: "MBBS, MCh (Neurosurgery)",
    years_experience: 16,
  },
  {
    hospital_slug: "sundarban-general-hospital",
    name: "Dr. Debashish Sen",
    specialty: "Interventional cardiology",
    qualifications: "MBBS, MD, DM (Cardiology)",
    years_experience: 21,
  },
  {
    hospital_slug: "sundarban-general-hospital",
    name: "Dr. Ruma Chatterjee",
    specialty: "Orthopaedic surgery",
    qualifications: "MBBS, MS (Orthopaedics)",
    years_experience: 13,
  },
  {
    hospital_slug: "sundarban-general-hospital",
    name: "Dr. Arup Majumdar",
    specialty: "Ophthalmology",
    qualifications: "MBBS, MS (Ophthalmology)",
    years_experience: 17,
  },
  {
    hospital_slug: "sabarmati-fertility-and-womens-health-centre",
    name: "Dr. Pooja Shah",
    specialty: "Reproductive medicine",
    qualifications: "MBBS, MD (Obstetrics & Gynaecology), Fellowship in Reproductive Medicine",
    years_experience: 16,
  },
  {
    hospital_slug: "sabarmati-fertility-and-womens-health-centre",
    name: "Dr. Nikhil Patel",
    specialty: "Andrology and embryology",
    qualifications: "MBBS, MS, Clinical Embryology",
    years_experience: 11,
  },
  {
    hospital_slug: "backwater-eye-and-vision-hospital",
    name: "Dr. Elizabeth Varghese",
    specialty: "Cataract and refractive surgery",
    qualifications: "MBBS, MS (Ophthalmology), FICO",
    years_experience: 19,
  },
  {
    hospital_slug: "backwater-eye-and-vision-hospital",
    name: "Dr. Manoj Pillai",
    specialty: "Vitreo-retinal surgery",
    qualifications: "MBBS, MS, FVRS",
    years_experience: 14,
  },
  {
    hospital_slug: "aravalli-neurosciences-hospital",
    name: "Dr. Gaurav Malhotra",
    specialty: "Neurosurgery",
    qualifications: "MBBS, MS, MCh (Neurosurgery)",
    years_experience: 20,
  },
  {
    hospital_slug: "aravalli-neurosciences-hospital",
    name: "Dr. Sneha Iyer",
    specialty: "Neurology and stroke medicine",
    qualifications: "MBBS, MD, DM (Neurology)",
    years_experience: 13,
  },
  {
    hospital_slug: "western-ghats-liver-and-digestive-institute",
    name: "Dr. Aditya Kamat",
    specialty: "Liver transplant surgery",
    qualifications: "MBBS, MS, Fellowship in Liver Transplantation",
    years_experience: 18,
  },
  {
    hospital_slug: "western-ghats-liver-and-digestive-institute",
    name: "Dr. Shirin Irani",
    specialty: "Hepatology",
    qualifications: "MBBS, MD, DM (Hepatology)",
    years_experience: 15,
  },
];
