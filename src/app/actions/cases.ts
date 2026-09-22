"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadError, filesFrom, storeUpload } from "@/lib/uploads";
import { COUNTRIES } from "@/lib/reference-data";
import type { CaseDocument, MedicalCase } from "@/lib/types";

export type ActionResult = { ok?: true; error?: string; message?: string };

const FLEXIBILITY = ["fixed", "flexible_weeks", "flexible_month", "asap", "unsure"] as const;

function isValidCountry(code: string) {
  return COUNTRIES.some((country) => country.code === code);
}

/** The patient's active case: the most recent one they submitted. */
export async function getActiveCase(patientId: string) {
  const cases = await db.listCasesByPatient(patientId);
  if (cases.length === 0) return null;
  return db.getCase(cases[0].id);
}

// Intake -------------------------------------------------------------------
export async function submitIntakeAction(_prev: ActionResult, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Your session has expired. Please sign in again to submit your case." };
  }
  if (user.role !== "patient") return { error: "Admin accounts cannot submit a patient case." };

  const treatmentSlug = String(formData.get("treatment_slug") ?? "");
  const diagnosis = String(formData.get("diagnosis_text") ?? "").trim();
  const travelFrom = String(formData.get("travel_from") ?? "").trim();
  const travelTo = String(formData.get("travel_to") ?? "").trim();
  const flexibility = String(formData.get("travel_flexibility") ?? "unsure");
  const attendants = Number(formData.get("attendants_count") ?? 0);
  const homeCountry = String(formData.get("home_country") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const treatment = treatmentSlug ? await db.getTreatmentBySlug(treatmentSlug) : null;
  if (!treatment) return { error: "Choose the treatment you are looking for." };
  if (diagnosis.length < 10) {
    return { error: "Tell us a little about your diagnosis or symptoms (at least a sentence)." };
  }
  if (!isValidCountry(homeCountry)) return { error: "Select the country you are travelling from." };
  if (!Number.isInteger(attendants) || attendants < 0 || attendants > 2) {
    return { error: "Attendants must be 0, 1 or 2." };
  }
  if (!(FLEXIBILITY as readonly string[]).includes(flexibility)) {
    return { error: "Select how flexible your travel dates are." };
  }

  const travelWindow =
    travelFrom && travelTo ? `${travelFrom} to ${travelTo}` : travelFrom || travelTo || "Not set";

  let records: Awaited<ReturnType<typeof storeUpload>>[] = [];
  try {
    records = await Promise.all(
      filesFrom(formData, "records").map((file) => storeUpload(file, "medical-records")),
    );
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    return { error: "We could not store your files. Please try again." };
  }

  const medicalCase = await db.createCase({
    patient_id: user.id,
    treatment_id: treatment.id,
    diagnosis_text: diagnosis,
    travel_window: travelWindow,
    travel_flexibility: flexibility,
    attendants_count: attendants,
    home_country: homeCountry,
    status: "submitted",
    assigned_admin_id: null,
    admin_notes: null,
  });

  await Promise.all(
    records.map((record) =>
      db.createDocument({
        case_id: medicalCase.id,
        patient_id: user.id,
        type: "medical_record",
        title: record.filename,
        file_url: record.key,
        file_size: record.size,
        content_type: record.contentType,
        uploaded_by: user.id,
        uploaded_by_role: "patient",
      }),
    ),
  );

  // Carry the name and nationality forward so KYC is a short step later.
  await db.upsertProfile(user.id, {
    full_name: fullName || user.full_name || null,
    nationality: homeCountry,
  });
  if (fullName && !user.full_name) await db.updateUser(user.id, { full_name: fullName });

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?submitted=1");
}

// Case editing -------------------------------------------------------------
export async function updateCaseAction(_prev: ActionResult, formData: FormData) {
  const user = await requirePatient();
  const caseId = String(formData.get("case_id") ?? "");
  const medicalCase = await db.getCase(caseId);
  if (!medicalCase || medicalCase.patient_id !== user.id) return { error: "Case not found." };
  if (medicalCase.locked) {
    return {
      error:
        "Your case is locked because your case manager is working with a hospital on it. Send a message and we will update it for you.",
    };
  }

  const diagnosis = String(formData.get("diagnosis_text") ?? "").trim();
  const travelFrom = String(formData.get("travel_from") ?? "").trim();
  const travelTo = String(formData.get("travel_to") ?? "").trim();
  const flexibility = String(formData.get("travel_flexibility") ?? medicalCase.travel_flexibility);
  const attendants = Number(formData.get("attendants_count") ?? medicalCase.attendants_count);
  const treatmentSlug = String(formData.get("treatment_slug") ?? "");

  if (diagnosis.length < 10) return { error: "Please keep a short description of your diagnosis." };
  if (!Number.isInteger(attendants) || attendants < 0 || attendants > 2) {
    return { error: "Attendants must be 0, 1 or 2." };
  }

  const patch: Partial<MedicalCase> = {
    diagnosis_text: diagnosis,
    travel_flexibility: flexibility,
    attendants_count: attendants,
  };
  if (travelFrom && travelTo) patch.travel_window = `${travelFrom} to ${travelTo}`;
  if (treatmentSlug) {
    const treatment = await db.getTreatmentBySlug(treatmentSlug);
    if (treatment) patch.treatment_id = treatment.id;
  }

  await db.updateCase(caseId, patch);
  revalidatePath("/dashboard", "layout");
  return { ok: true as const, message: "Your case has been updated." };
}

export async function uploadRecordsAction(_prev: ActionResult, formData: FormData) {
  const user = await requirePatient();
  const caseId = String(formData.get("case_id") ?? "");
  const medicalCase = await db.getCase(caseId);
  if (!medicalCase || medicalCase.patient_id !== user.id) return { error: "Case not found." };

  const files = filesFrom(formData, "records");
  if (files.length === 0) return { error: "Choose at least one file to upload." };

  try {
    const stored = await Promise.all(files.map((file) => storeUpload(file, "medical-records")));
    await Promise.all(
      stored.map((record) =>
        db.createDocument({
          case_id: caseId,
          patient_id: user.id,
          type: "medical_record",
          title: record.filename,
          file_url: record.key,
          file_size: record.size,
          content_type: record.contentType,
          uploaded_by: user.id,
          uploaded_by_role: "patient",
        }),
      ),
    );
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    return { error: "We could not store your files. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true as const, message: `${files.length} file(s) added to your case.` };
}

export async function deleteOwnDocumentAction(formData: FormData) {
  const user = await requirePatient();
  const documentId = String(formData.get("document_id") ?? "");
  const document = await db.getDocument(documentId);
  if (!document || document.patient_id !== user.id) return;
  // Patients may withdraw their own uploads, never staff-issued paperwork.
  const removable: CaseDocument["type"][] = ["medical_record", "passport", "other"];
  if (document.uploaded_by_role !== "patient" || !removable.includes(document.type)) return;

  await db.deleteDocument(documentId);
  revalidatePath("/dashboard", "layout");
}

// Profile and KYC ----------------------------------------------------------
export async function updateProfileAction(_prev: ActionResult, formData: FormData) {
  const user = await requirePatient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "");
  const passportNumber = String(formData.get("passport_number") ?? "").trim();

  if (fullName.length < 2) return { error: "Enter your full name as it appears on your passport." };
  if (nationality && !isValidCountry(nationality)) return { error: "Select your nationality." };

  const [passportFile] = filesFrom(formData, "passport");
  let passportKey: string | undefined;
  if (passportFile) {
    try {
      const stored = await storeUpload(passportFile, "identity-docs");
      passportKey = stored.key;
      await db.createDocument({
        case_id: (await getActiveCase(user.id))?.id ?? null,
        patient_id: user.id,
        type: "passport",
        title: stored.filename,
        file_url: stored.key,
        file_size: stored.size,
        content_type: stored.contentType,
        uploaded_by: user.id,
        uploaded_by_role: "patient",
      });
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message };
      return { error: "We could not store your passport copy. Please try again." };
    }
  }

  await db.upsertProfile(user.id, {
    full_name: fullName,
    dob: dob || null,
    nationality: nationality || null,
    passport_number: passportNumber || null,
    ...(passportKey ? { passport_doc_url: passportKey } : {}),
  });
  if (fullName !== user.full_name) await db.updateUser(user.id, { full_name: fullName });

  revalidatePath("/dashboard", "layout");
  return { ok: true as const, message: "Your details have been saved." };
}

// Quotes -------------------------------------------------------------------
export async function respondToMatchAction(formData: FormData) {
  const user = await requirePatient();
  const matchId = String(formData.get("match_id") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const match = await db.getMatch(matchId);
  if (!match) return;

  const medicalCase = await db.getCase(match.case_id);
  if (!medicalCase || medicalCase.patient_id !== user.id) return;

  const status = intent === "decline" ? "declined" : "patient_interested";
  await db.updateMatch(matchId, { status });

  // The case manager is notified in-thread; there is no automated booking.
  const hospital = await db.getHospital(match.hospital_id);
  await db.createMessage({
    case_id: match.case_id,
    sender_id: user.id,
    sender_role: "patient",
    sender_name: user.full_name ?? "Patient",
    body:
      status === "patient_interested"
        ? `I would like to go ahead with ${hospital?.name ?? "this hospital"}. Please tell me the next step.`
        : `I would prefer not to proceed with ${hospital?.name ?? "this hospital"}.`,
  });

  revalidatePath("/dashboard", "layout");
}

// Messaging ----------------------------------------------------------------
export async function sendPatientMessageAction(_prev: ActionResult, formData: FormData) {
  const user = await requirePatient();
  const caseId = String(formData.get("case_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > 4000) return { error: "That message is too long. Please shorten it." };

  const medicalCase = await db.getCase(caseId);
  if (!medicalCase || medicalCase.patient_id !== user.id) return { error: "Case not found." };

  await db.createMessage({
    case_id: caseId,
    sender_id: user.id,
    sender_role: "patient",
    sender_name: user.full_name ?? "Patient",
    body,
  });

  revalidatePath("/dashboard/messages");
  return { ok: true as const };
}
