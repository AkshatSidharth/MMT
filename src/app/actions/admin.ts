"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { COUNTRIES } from "@/lib/reference-data";
import { UploadError, filesFrom, storeUpload } from "@/lib/uploads";
import {
  CASE_STATUSES,
  DOCUMENT_TYPES,
  LEAD_STAGES,
  type Accreditation,
  type CaseStatus,
  type DocumentType,
  type LeadStage,
  type QuoteLine,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

export type AdminResult = { ok?: true; error?: string; message?: string };

const ACCREDITATIONS: Accreditation[] = ["NABH", "JCI", "NABL", "ISO"];

function lines(value: string) {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function revalidateCase(caseId: string) {
  revalidatePath(`/admin/cases/${caseId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/cases");
  revalidatePath("/dashboard", "layout");
}

// Pipeline ------------------------------------------------------------------
export async function updateCaseStatusAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!(CASE_STATUSES as readonly string[]).includes(status)) return;

  await db.updateCase(caseId, { status: status as CaseStatus });
  revalidateCase(caseId);
}

export async function assignCaseManagerAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const adminId = String(formData.get("assigned_admin_id") ?? "");
  await db.updateCase(caseId, { assigned_admin_id: adminId || null });
  revalidateCase(caseId);
}

export async function setCaseLockAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const locked = String(formData.get("locked") ?? "") === "true";
  await db.updateCase(caseId, { locked });
  revalidateCase(caseId);
}

export async function saveCaseNotesAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const notes = String(formData.get("admin_notes") ?? "").trim();
  await db.updateCase(caseId, { admin_notes: notes || null });
  revalidateCase(caseId);
  return { ok: true as const, message: "Internal notes saved." };
}

export async function setKycStatusAction(formData: FormData) {
  await requireAdmin();
  const patientId = String(formData.get("patient_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const status = String(formData.get("kyc_status") ?? "");
  if (status !== "pending" && status !== "verified") return;

  await db.upsertProfile(patientId, { kyc_status: status });
  revalidateCase(caseId);
}

// Matching and quotes -------------------------------------------------------
export async function addMatchAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const hospitalId = String(formData.get("hospital_id") ?? "");
  if (!hospitalId) return { error: "Choose a hospital to match." };

  const existing = await db.listMatches(caseId);
  if (existing.some((match) => match.hospital_id === hospitalId)) {
    return { error: "That hospital is already matched to this case." };
  }

  await db.createMatch({
    case_id: caseId,
    hospital_id: hospitalId,
    quote_amount: null,
    quote_details: null,
    quote_breakdown: [],
    status: "proposed",
  });

  const medicalCase = await db.getCase(caseId);
  // Matching is the point at which the patient's stepper should advance.
  if (medicalCase && (medicalCase.status === "submitted" || medicalCase.status === "under_review")) {
    await db.updateCase(caseId, { status: "hospitals_matched" });
  }

  revalidateCase(caseId);
  return { ok: true as const, message: "Hospital matched to this case." };
}

export async function removeMatchAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  await db.deleteMatch(String(formData.get("match_id") ?? ""));
  revalidateCase(caseId);
}

export async function saveQuoteAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const details = String(formData.get("quote_details") ?? "").trim();

  const labels = formData.getAll("line_label").map((value) => String(value).trim());
  const amounts = formData.getAll("line_amount").map((value) => Number(value));

  const breakdown: QuoteLine[] = [];
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const amount = amounts[index];
    if (!label) continue;
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: `Enter a valid amount for "${label}".` };
    }
    breakdown.push({ label, amount: Math.round(amount) });
  }

  if (breakdown.length === 0) {
    return { error: "Add at least one line item — the patient sees the breakdown." };
  }

  const total = breakdown.reduce((sum, line) => sum + line.amount, 0);
  await db.updateMatch(matchId, {
    quote_amount: total,
    quote_details: details || null,
    quote_breakdown: breakdown,
  });

  const medicalCase = await db.getCase(caseId);
  if (medicalCase && CASE_STATUSES.indexOf(medicalCase.status) < CASE_STATUSES.indexOf("quote_ready")) {
    await db.updateCase(caseId, { status: "quote_ready" });
  }

  revalidateCase(caseId);
  return { ok: true as const, message: `Quote saved and published to the patient.` };
}

export async function setMatchStatusAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["proposed", "patient_interested", "declined", "confirmed"].includes(status)) return;
  await db.updateMatch(matchId, { status: status as never });
  revalidateCase(caseId);
}

// Consultation --------------------------------------------------------------
export async function scheduleConsultationAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const hospitalId = String(formData.get("hospital_id") ?? "");
  const doctorName = String(formData.get("doctor_name") ?? "").trim();
  const date = String(formData.get("scheduled_date") ?? "");
  const time = String(formData.get("scheduled_time") ?? "");
  const joinLink = String(formData.get("join_link") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !time) return { error: "Enter the consultation date and time." };
  const scheduledAt = new Date(`${date}T${time}`);
  if (Number.isNaN(scheduledAt.getTime())) return { error: "That date and time are not valid." };
  if (!doctorName) return { error: "Enter the doctor's name, as the patient will see it." };
  if (joinLink && !/^https?:\/\//i.test(joinLink)) {
    return { error: "The joining link must start with http:// or https://." };
  }

  await db.upsertConsultation(caseId, {
    hospital_id: hospitalId || null,
    doctor_name: doctorName,
    scheduled_at: scheduledAt.toISOString(),
    join_link: joinLink,
    notes: notes || null,
  });

  const medicalCase = await db.getCase(caseId);
  if (
    medicalCase &&
    CASE_STATUSES.indexOf(medicalCase.status) < CASE_STATUSES.indexOf("consultation_scheduled")
  ) {
    await db.updateCase(caseId, { status: "consultation_scheduled" });
  }

  revalidateCase(caseId);
  return { ok: true as const, message: "Consultation published to the patient's dashboard." };
}

// Documents ----------------------------------------------------------------
export async function uploadCaseDocumentAction(_prev: AdminResult, formData: FormData) {
  const admin = await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const type = String(formData.get("type") ?? "other");
  const title = String(formData.get("title") ?? "").trim();
  if (!(DOCUMENT_TYPES as readonly string[]).includes(type)) return { error: "Pick a document type." };

  const medicalCase = await db.getCase(caseId);
  if (!medicalCase) return { error: "Case not found." };

  const files = filesFrom(formData, "file");
  if (files.length === 0) return { error: "Choose a file to upload." };

  try {
    const stored = await storeUpload(files[0], "case-documents");
    await db.createDocument({
      case_id: caseId,
      patient_id: medicalCase.patient_id,
      type: type as DocumentType,
      title: title || stored.filename,
      file_url: stored.key,
      file_size: stored.size,
      content_type: stored.contentType,
      uploaded_by: admin.id,
      uploaded_by_role: "admin",
    });
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    return { error: "Upload failed. Please try again." };
  }

  revalidateCase(caseId);
  return { ok: true as const, message: "Document published to the patient." };
}

export async function deleteCaseDocumentAction(formData: FormData) {
  await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  await db.deleteDocument(String(formData.get("document_id") ?? ""));
  revalidateCase(caseId);
}

// Messaging ----------------------------------------------------------------
export async function sendAdminMessageAction(_prev: AdminResult, formData: FormData) {
  const admin = await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };

  const medicalCase = await db.getCase(caseId);
  if (!medicalCase) return { error: "Case not found." };

  await db.createMessage({
    case_id: caseId,
    sender_id: admin.id,
    sender_role: "admin",
    sender_name: admin.full_name ?? "Case manager",
    body,
  });

  // Replying takes ownership if nobody has the case yet.
  if (!medicalCase.assigned_admin_id) {
    await db.updateCase(caseId, { assigned_admin_id: admin.id });
  }

  revalidateCase(caseId);
  return { ok: true as const };
}

// Leads --------------------------------------------------------------------
export async function updateLeadAction(formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("lead_id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!(LEAD_STAGES as readonly string[]).includes(stage)) return;
  await db.updateLead(leadId, { stage: stage as LeadStage });
  revalidatePath("/admin/pipeline");
}

export async function saveLeadNotesAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const leadId = String(formData.get("lead_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  await db.updateLead(leadId, { notes: notes || null });
  revalidatePath("/admin/pipeline");
  return { ok: true as const, message: "Lead notes saved." };
}

// Supply CMS: treatments ----------------------------------------------------
export async function saveTreatmentAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const min = Number(formData.get("indicative_cost_min") ?? 0);
  const max = Number(formData.get("indicative_cost_max") ?? 0);

  if (name.length < 3) return { error: "Enter the treatment name." };
  if (!category) return { error: "Enter a category, for example Cardiac sciences." };
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    return { error: "Check the indicative cost band — the maximum must be at or above the minimum." };
  }

  const referenceCosts: Record<string, number> = {};
  COUNTRIES.forEach((country) => {
    const raw = formData.get(`ref_${country.code}`);
    if (raw === null || String(raw).trim() === "") return;
    const amount = Number(raw);
    if (Number.isFinite(amount) && amount > 0) referenceCosts[country.code] = Math.round(amount);
  });

  const payload = {
    name,
    slug,
    category,
    description: String(formData.get("description") ?? "").trim(),
    overview: String(formData.get("overview") ?? "").trim() || null,
    stay_summary: String(formData.get("stay_summary") ?? "").trim() || null,
    indicative_cost_min: Math.round(min),
    indicative_cost_max: Math.round(max),
    home_country_reference_costs: referenceCosts,
  };

  try {
    if (id) await db.updateTreatment(id, payload);
    else await db.createTreatment(payload);
  } catch {
    return { error: "Could not save. Is the slug already used by another treatment?" };
  }

  revalidatePath("/admin/treatments");
  revalidatePath("/treatments", "layout");
  return { ok: true as const, message: `Saved "${name}".` };
}

export async function deleteTreatmentAction(formData: FormData) {
  await requireAdmin();
  await db.deleteTreatment(String(formData.get("id") ?? ""));
  revalidatePath("/admin/treatments");
  revalidatePath("/treatments", "layout");
}

// Supply CMS: hospitals -----------------------------------------------------
export async function saveHospitalAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  if (name.length < 3) return { error: "Enter the hospital name." };
  if (!city) return { error: "Enter the city." };

  const accreditation = ACCREDITATIONS.filter((code) => formData.get(`accreditation_${code}`));
  const beds = Number(formData.get("beds") ?? 0);
  const established = Number(formData.get("established_year") ?? 0);

  const payload = {
    name,
    slug,
    city,
    accreditation,
    specialties: lines(String(formData.get("specialties") ?? "")),
    about: String(formData.get("about") ?? "").trim(),
    facilities: lines(String(formData.get("facilities") ?? "")),
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    beds: Number.isFinite(beds) && beds > 0 ? Math.round(beds) : null,
    established_year:
      Number.isFinite(established) && established > 1800 ? Math.round(established) : null,
    intl_desk_contact: String(formData.get("intl_desk_contact") ?? "").trim() || null,
    treatment_slugs: formData.getAll("treatment_slugs").map((value) => String(value)),
  };

  try {
    if (id) await db.updateHospital(id, payload);
    else await db.createHospital(payload);
  } catch {
    return { error: "Could not save. Is the slug already used by another hospital?" };
  }

  revalidatePath("/admin/hospitals");
  revalidatePath("/hospitals", "layout");
  return { ok: true as const, message: `Saved "${name}".` };
}

export async function deleteHospitalAction(formData: FormData) {
  await requireAdmin();
  await db.deleteHospital(String(formData.get("id") ?? ""));
  revalidatePath("/admin/hospitals");
  revalidatePath("/hospitals", "layout");
}

// Supply CMS: doctors -------------------------------------------------------
export async function saveDoctorAction(_prev: AdminResult, formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hospitalId = String(formData.get("hospital_id") ?? "");
  const specialty = String(formData.get("specialty") ?? "").trim();
  const years = Number(formData.get("years_experience") ?? 0);

  if (name.length < 3) return { error: "Enter the doctor's name." };
  if (!hospitalId) return { error: "Choose the hospital this doctor practises at." };
  if (!specialty) return { error: "Enter a specialty." };
  if (!Number.isFinite(years) || years < 0 || years > 70) {
    return { error: "Years of experience should be between 0 and 70." };
  }

  const payload = {
    hospital_id: hospitalId,
    name,
    specialty,
    qualifications: String(formData.get("qualifications") ?? "").trim(),
    years_experience: Math.round(years),
    photo_url: String(formData.get("photo_url") ?? "").trim() || null,
  };

  if (id) await db.updateDoctor(id, payload);
  else await db.createDoctor(payload);

  revalidatePath("/admin/doctors");
  revalidatePath("/hospitals", "layout");
  return { ok: true as const, message: `Saved ${name}.` };
}

export async function deleteDoctorAction(formData: FormData) {
  await requireAdmin();
  await db.deleteDoctor(String(formData.get("id") ?? ""));
  revalidatePath("/admin/doctors");
  revalidatePath("/hospitals", "layout");
}
