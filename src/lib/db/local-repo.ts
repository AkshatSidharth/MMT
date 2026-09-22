import fs from "node:fs";
import path from "node:path";
import {
  UPLOAD_DIR,
  getStore,
  mutate,
  newId,
  nextCaseReference,
  timestamp,
} from "./local-store";
import type { CaseFilter, HospitalFilter, NewFile, Repo, StoredFile } from "./repo";
import type {
  CaseDocument,
  CaseWithRelations,
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

const byCreatedDesc = <T extends { created_at: string }>(a: T, b: T) =>
  b.created_at.localeCompare(a.created_at);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Filesystem-backed implementation used when Supabase is not configured. */
export class LocalRepo implements Repo {
  readonly kind = "local" as const;

  // Users -------------------------------------------------------------------
  async getUser(id: string) {
    return clone(getStore().users.find((user) => user.id === id) ?? null);
  }

  async getUserByEmail(email: string) {
    const needle = email.trim().toLowerCase();
    return clone(getStore().users.find((user) => user.email?.toLowerCase() === needle) ?? null);
  }

  async getUserByPhone(phone: string) {
    const needle = phone.replace(/\s/g, "");
    return clone(getStore().users.find((user) => user.phone === needle) ?? null);
  }

  async createUser(input: Parameters<Repo["createUser"]>[0]) {
    return mutate((store) => {
      const user: User = {
        id: input.id ?? newId(),
        email: input.email ?? null,
        phone: input.phone ?? null,
        role: input.role ?? "patient",
        full_name: input.full_name ?? null,
        language: input.language ?? "en",
        language_chosen: false,
        created_at: timestamp(),
      };
      store.users.push(user);
      return clone(user);
    });
  }

  async updateUser(id: string, patch: Partial<User>) {
    return mutate((store) => {
      const user = store.users.find((item) => item.id === id);
      if (!user) throw new Error(`User ${id} not found`);
      Object.assign(user, patch);
      return clone(user);
    });
  }

  async listAdmins() {
    return clone(getStore().users.filter((user) => user.role === "admin"));
  }

  // Patient profiles --------------------------------------------------------
  async getProfile(userId: string) {
    return clone(
      getStore().patient_profiles.find((profile) => profile.user_id === userId) ?? null,
    );
  }

  async upsertProfile(userId: string, patch: Partial<PatientProfile>) {
    return mutate((store) => {
      let profile = store.patient_profiles.find((item) => item.user_id === userId);
      if (!profile) {
        profile = {
          user_id: userId,
          full_name: null,
          dob: null,
          nationality: null,
          passport_number: null,
          passport_doc_url: null,
          kyc_status: "pending",
          updated_at: timestamp(),
        };
        store.patient_profiles.push(profile);
      }
      Object.assign(profile, patch, { user_id: userId, updated_at: timestamp() });
      return clone(profile);
    });
  }

  // Treatments --------------------------------------------------------------
  async listTreatments() {
    return clone(
      [...getStore().treatments].sort(
        (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      ),
    );
  }

  async getTreatment(id: string) {
    return clone(getStore().treatments.find((treatment) => treatment.id === id) ?? null);
  }

  async getTreatmentBySlug(slug: string) {
    return clone(getStore().treatments.find((treatment) => treatment.slug === slug) ?? null);
  }

  async createTreatment(input: Omit<Treatment, "id" | "created_at">) {
    return mutate((store) => {
      const treatment: Treatment = { ...input, id: newId(), created_at: timestamp() };
      store.treatments.push(treatment);
      return clone(treatment);
    });
  }

  async updateTreatment(id: string, patch: Partial<Treatment>) {
    return mutate((store) => {
      const treatment = store.treatments.find((item) => item.id === id);
      if (!treatment) throw new Error(`Treatment ${id} not found`);
      Object.assign(treatment, patch);
      return clone(treatment);
    });
  }

  async deleteTreatment(id: string) {
    mutate((store) => {
      store.treatments = store.treatments.filter((item) => item.id !== id);
      store.medical_cases.forEach((medicalCase) => {
        if (medicalCase.treatment_id === id) medicalCase.treatment_id = null;
      });
    });
  }

  // Hospitals ---------------------------------------------------------------
  async listHospitals(filter: HospitalFilter = {}) {
    const query = filter.query?.trim().toLowerCase();
    const hospitals = getStore().hospitals.filter((hospital) => {
      if (filter.city && hospital.city !== filter.city) return false;
      if (filter.specialty && !hospital.specialties.includes(filter.specialty)) return false;
      if (
        filter.accreditation &&
        !hospital.accreditation.includes(filter.accreditation as Hospital["accreditation"][number])
      ) {
        return false;
      }
      if (filter.treatmentSlug && !hospital.treatment_slugs.includes(filter.treatmentSlug)) {
        return false;
      }
      if (query) {
        const haystack = [hospital.name, hospital.city, ...hospital.specialties]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    return clone(hospitals.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async getHospital(id: string) {
    return clone(getStore().hospitals.find((hospital) => hospital.id === id) ?? null);
  }

  async getHospitalBySlug(slug: string) {
    return clone(getStore().hospitals.find((hospital) => hospital.slug === slug) ?? null);
  }

  async createHospital(input: Omit<Hospital, "id" | "created_at">) {
    return mutate((store) => {
      const hospital: Hospital = { ...input, id: newId(), created_at: timestamp() };
      store.hospitals.push(hospital);
      return clone(hospital);
    });
  }

  async updateHospital(id: string, patch: Partial<Hospital>) {
    return mutate((store) => {
      const hospital = store.hospitals.find((item) => item.id === id);
      if (!hospital) throw new Error(`Hospital ${id} not found`);
      Object.assign(hospital, patch);
      return clone(hospital);
    });
  }

  async deleteHospital(id: string) {
    mutate((store) => {
      store.hospitals = store.hospitals.filter((item) => item.id !== id);
      store.doctors = store.doctors.filter((doctor) => doctor.hospital_id !== id);
      store.matches = store.matches.filter((match) => match.hospital_id !== id);
    });
  }

  // Doctors -----------------------------------------------------------------
  async listDoctors(hospitalId?: string) {
    const doctors = getStore().doctors.filter(
      (doctor) => !hospitalId || doctor.hospital_id === hospitalId,
    );
    return clone(doctors.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async getDoctor(id: string) {
    return clone(getStore().doctors.find((doctor) => doctor.id === id) ?? null);
  }

  async createDoctor(input: Omit<Doctor, "id" | "created_at">) {
    return mutate((store) => {
      const doctor: Doctor = { ...input, id: newId(), created_at: timestamp() };
      store.doctors.push(doctor);
      return clone(doctor);
    });
  }

  async updateDoctor(id: string, patch: Partial<Doctor>) {
    return mutate((store) => {
      const doctor = store.doctors.find((item) => item.id === id);
      if (!doctor) throw new Error(`Doctor ${id} not found`);
      Object.assign(doctor, patch);
      return clone(doctor);
    });
  }

  async deleteDoctor(id: string) {
    mutate((store) => {
      store.doctors = store.doctors.filter((item) => item.id !== id);
    });
  }

  // Cases -------------------------------------------------------------------
  private hydrate(medicalCase: MedicalCase): CaseWithRelations {
    const store = getStore();
    const matches = store.matches
      .filter((match) => match.case_id === medicalCase.id)
      .map((match) => ({
        ...match,
        hospital: store.hospitals.find((hospital) => hospital.id === match.hospital_id) ?? null,
      }));

    return clone({
      ...medicalCase,
      patient: store.users.find((user) => user.id === medicalCase.patient_id) ?? null,
      profile:
        store.patient_profiles.find((profile) => profile.user_id === medicalCase.patient_id) ??
        null,
      treatment: store.treatments.find((item) => item.id === medicalCase.treatment_id) ?? null,
      assigned_admin:
        store.users.find((user) => user.id === medicalCase.assigned_admin_id) ?? null,
      documents: store.documents
        .filter((document) => document.case_id === medicalCase.id)
        .sort(byCreatedDesc),
      matches,
      consultation:
        store.consultations.find((item) => item.case_id === medicalCase.id) ?? null,
      message_count: store.messages.filter((message) => message.case_id === medicalCase.id).length,
    });
  }

  async listCases(filter: CaseFilter = {}) {
    const store = getStore();
    const query = filter.query?.trim().toLowerCase();
    return store.medical_cases
      .filter((medicalCase) => {
        if (filter.status && medicalCase.status !== filter.status) return false;
        if (filter.assignedAdminId && medicalCase.assigned_admin_id !== filter.assignedAdminId) {
          return false;
        }
        if (query) {
          const patient = store.users.find((user) => user.id === medicalCase.patient_id);
          const treatment = store.treatments.find((item) => item.id === medicalCase.treatment_id);
          const haystack = [
            medicalCase.reference,
            patient?.full_name,
            patient?.email,
            treatment?.name,
            medicalCase.home_country,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort(byCreatedDesc)
      .map((medicalCase) => this.hydrate(medicalCase));
  }

  async listCasesByPatient(patientId: string) {
    return clone(
      getStore()
        .medical_cases.filter((medicalCase) => medicalCase.patient_id === patientId)
        .sort(byCreatedDesc),
    );
  }

  async getCase(id: string) {
    const medicalCase = getStore().medical_cases.find((item) => item.id === id);
    return medicalCase ? this.hydrate(medicalCase) : null;
  }

  async createCase(input: Parameters<Repo["createCase"]>[0]) {
    const reference = nextCaseReference();
    return mutate((store) => {
      const medicalCase: MedicalCase = {
        ...input,
        id: newId(),
        reference,
        locked: input.locked ?? false,
        created_at: timestamp(),
        updated_at: timestamp(),
      };
      store.medical_cases.push(medicalCase);
      return clone(medicalCase);
    });
  }

  async updateCase(id: string, patch: Partial<MedicalCase>) {
    return mutate((store) => {
      const medicalCase = store.medical_cases.find((item) => item.id === id);
      if (!medicalCase) throw new Error(`Case ${id} not found`);
      Object.assign(medicalCase, patch, { updated_at: timestamp() });
      return clone(medicalCase);
    });
  }

  // Documents ---------------------------------------------------------------
  async listDocuments(filter: { caseId?: string; patientId?: string }) {
    return clone(
      getStore()
        .documents.filter((document) => {
          if (filter.caseId && document.case_id !== filter.caseId) return false;
          if (filter.patientId && document.patient_id !== filter.patientId) return false;
          return true;
        })
        .sort(byCreatedDesc),
    );
  }

  async getDocument(id: string) {
    return clone(getStore().documents.find((document) => document.id === id) ?? null);
  }

  async getDocumentByKey(key: string) {
    return clone(getStore().documents.find((document) => document.file_url === key) ?? null);
  }

  async createDocument(input: Omit<CaseDocument, "id" | "created_at">) {
    return mutate((store) => {
      const document: CaseDocument = { ...input, id: newId(), created_at: timestamp() };
      store.documents.push(document);
      return clone(document);
    });
  }

  async deleteDocument(id: string) {
    mutate((store) => {
      const document = store.documents.find((item) => item.id === id);
      store.documents = store.documents.filter((item) => item.id !== id);
      if (document) {
        const target = path.join(UPLOAD_DIR, document.file_url);
        try {
          if (target.startsWith(UPLOAD_DIR) && fs.existsSync(target)) fs.unlinkSync(target);
        } catch {
          // Leaving an orphaned dev file behind is preferable to failing the delete.
        }
      }
    });
  }

  // Matches -----------------------------------------------------------------
  async listMatches(caseId: string) {
    return clone(
      getStore()
        .matches.filter((match) => match.case_id === caseId)
        .sort(byCreatedDesc),
    );
  }

  async getMatch(id: string) {
    return clone(getStore().matches.find((match) => match.id === id) ?? null);
  }

  async createMatch(input: Omit<Match, "id" | "created_at">) {
    return mutate((store) => {
      const match: Match = { ...input, id: newId(), created_at: timestamp() };
      store.matches.push(match);
      return clone(match);
    });
  }

  async updateMatch(id: string, patch: Partial<Match>) {
    return mutate((store) => {
      const match = store.matches.find((item) => item.id === id);
      if (!match) throw new Error(`Match ${id} not found`);
      Object.assign(match, patch);
      return clone(match);
    });
  }

  async deleteMatch(id: string) {
    mutate((store) => {
      store.matches = store.matches.filter((item) => item.id !== id);
    });
  }

  // Consultations -----------------------------------------------------------
  async getConsultation(caseId: string) {
    return clone(getStore().consultations.find((item) => item.case_id === caseId) ?? null);
  }

  async upsertConsultation(
    caseId: string,
    input: Omit<Consultation, "id" | "created_at" | "case_id">,
  ) {
    return mutate((store) => {
      let consultation = store.consultations.find((item) => item.case_id === caseId);
      if (!consultation) {
        consultation = { ...input, id: newId(), case_id: caseId, created_at: timestamp() };
        store.consultations.push(consultation);
      } else {
        Object.assign(consultation, input);
      }
      return clone(consultation);
    });
  }

  // Messages ----------------------------------------------------------------
  async listMessages(caseId: string) {
    return clone(
      getStore()
        .messages.filter((message) => message.case_id === caseId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
  }

  async createMessage(input: Omit<Message, "id" | "created_at">) {
    return mutate((store) => {
      const message: Message = { ...input, id: newId(), created_at: timestamp() };
      store.messages.push(message);
      return clone(message);
    });
  }

  // Leads -------------------------------------------------------------------
  async listLeads() {
    return clone([...getStore().leads].sort(byCreatedDesc));
  }

  async createLead(input: Omit<Lead, "id" | "created_at">) {
    return mutate((store) => {
      const lead: Lead = { ...input, id: newId(), created_at: timestamp() };
      store.leads.push(lead);
      return clone(lead);
    });
  }

  async updateLead(id: string, patch: Partial<Lead>) {
    return mutate((store) => {
      const lead = store.leads.find((item) => item.id === id);
      if (!lead) throw new Error(`Lead ${id} not found`);
      Object.assign(lead, patch);
      return clone(lead);
    });
  }

  // Files -------------------------------------------------------------------
  async putFile(file: NewFile): Promise<StoredFile> {
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const key = `${file.bucket}/${newId()}-${safeName}`;
    const target = path.join(UPLOAD_DIR, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.bytes);
    return { key, size: file.bytes.byteLength };
  }

  async getFileUrl(key: string) {
    // Served through an authorising route handler, never as a static asset.
    return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async readFile(key: string) {
    const target = path.join(UPLOAD_DIR, key);
    if (!path.resolve(target).startsWith(path.resolve(UPLOAD_DIR))) return null;
    if (!fs.existsSync(target)) return null;
    const document = getStore().documents.find((item) => item.file_url === key);
    return {
      bytes: new Uint8Array(fs.readFileSync(target)),
      contentType: document?.content_type ?? "application/octet-stream",
    };
  }

  // Phone OTP ---------------------------------------------------------------
  async saveOtp(phone: string, code: string, expiresAt: string) {
    mutate((store) => {
      store.otps = store.otps.filter((otp) => otp.phone !== phone);
      store.otps.push({ phone, code, expires_at: expiresAt });
    });
  }

  async consumeOtp(phone: string, code: string) {
    return mutate((store) => {
      const otp = store.otps.find((item) => item.phone === phone && item.code === code);
      if (!otp) return false;
      store.otps = store.otps.filter((item) => item.phone !== phone);
      return new Date(otp.expires_at).getTime() > Date.now();
    });
  }
}
