import type {
  CaseDocument,
  CaseStatus,
  CaseWithRelations,
  Consultation,
  Doctor,
  Hospital,
  Lead,
  Match,
  MedicalCase,
  Message,
  PatientProfile,
  Role,
  Treatment,
  User,
} from "@/lib/types";

export interface HospitalFilter {
  city?: string;
  specialty?: string;
  accreditation?: string;
  treatmentSlug?: string;
  query?: string;
}

export interface CaseFilter {
  status?: CaseStatus;
  assignedAdminId?: string;
  query?: string;
}

export interface NewFile {
  bucket: "medical-records" | "identity-docs" | "case-documents";
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface StoredFile {
  /** Storage key, persisted on the document row. Resolved to a URL on read. */
  key: string;
  size: number;
}

/**
 * Every read and write in the app goes through this interface, so the app runs
 * either against Supabase (production) or against the bundled local store
 * (development, before Supabase credentials exist).
 */
export interface Repo {
  readonly kind: "supabase" | "local";

  // Users -------------------------------------------------------------------
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  createUser(input: {
    email?: string | null;
    phone?: string | null;
    full_name?: string | null;
    role?: Role;
    language?: User["language"];
    id?: string;
  }): Promise<User>;
  updateUser(id: string, patch: Partial<Omit<User, "id" | "created_at">>): Promise<User>;
  listAdmins(): Promise<User[]>;

  // Patient profiles --------------------------------------------------------
  getProfile(userId: string): Promise<PatientProfile | null>;
  upsertProfile(userId: string, patch: Partial<PatientProfile>): Promise<PatientProfile>;

  // Treatments --------------------------------------------------------------
  listTreatments(): Promise<Treatment[]>;
  getTreatment(id: string): Promise<Treatment | null>;
  getTreatmentBySlug(slug: string): Promise<Treatment | null>;
  createTreatment(input: Omit<Treatment, "id" | "created_at">): Promise<Treatment>;
  updateTreatment(id: string, patch: Partial<Treatment>): Promise<Treatment>;
  deleteTreatment(id: string): Promise<void>;

  // Hospitals ---------------------------------------------------------------
  listHospitals(filter?: HospitalFilter): Promise<Hospital[]>;
  getHospital(id: string): Promise<Hospital | null>;
  getHospitalBySlug(slug: string): Promise<Hospital | null>;
  createHospital(input: Omit<Hospital, "id" | "created_at">): Promise<Hospital>;
  updateHospital(id: string, patch: Partial<Hospital>): Promise<Hospital>;
  deleteHospital(id: string): Promise<void>;

  // Doctors -----------------------------------------------------------------
  listDoctors(hospitalId?: string): Promise<Doctor[]>;
  getDoctor(id: string): Promise<Doctor | null>;
  createDoctor(input: Omit<Doctor, "id" | "created_at">): Promise<Doctor>;
  updateDoctor(id: string, patch: Partial<Doctor>): Promise<Doctor>;
  deleteDoctor(id: string): Promise<void>;

  // Cases -------------------------------------------------------------------
  listCases(filter?: CaseFilter): Promise<CaseWithRelations[]>;
  listCasesByPatient(patientId: string): Promise<MedicalCase[]>;
  getCase(id: string): Promise<CaseWithRelations | null>;
  createCase(
    input: Omit<MedicalCase, "id" | "reference" | "created_at" | "updated_at" | "locked"> & {
      locked?: boolean;
    },
  ): Promise<MedicalCase>;
  updateCase(id: string, patch: Partial<MedicalCase>): Promise<MedicalCase>;

  // Documents ---------------------------------------------------------------
  listDocuments(filter: { caseId?: string; patientId?: string }): Promise<CaseDocument[]>;
  getDocument(id: string): Promise<CaseDocument | null>;
  /** Looks a document up by its storage key, to authorise file downloads. */
  getDocumentByKey(key: string): Promise<CaseDocument | null>;
  createDocument(input: Omit<CaseDocument, "id" | "created_at">): Promise<CaseDocument>;
  deleteDocument(id: string): Promise<void>;

  // Matches and quotes ------------------------------------------------------
  listMatches(caseId: string): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  createMatch(input: Omit<Match, "id" | "created_at">): Promise<Match>;
  updateMatch(id: string, patch: Partial<Match>): Promise<Match>;
  deleteMatch(id: string): Promise<void>;

  // Consultations -----------------------------------------------------------
  getConsultation(caseId: string): Promise<Consultation | null>;
  upsertConsultation(
    caseId: string,
    input: Omit<Consultation, "id" | "created_at" | "case_id">,
  ): Promise<Consultation>;

  // Messages ----------------------------------------------------------------
  listMessages(caseId: string): Promise<Message[]>;
  createMessage(input: Omit<Message, "id" | "created_at">): Promise<Message>;

  // Leads -------------------------------------------------------------------
  listLeads(): Promise<Lead[]>;
  createLead(input: Omit<Lead, "id" | "created_at">): Promise<Lead>;
  updateLead(id: string, patch: Partial<Lead>): Promise<Lead>;

  // Files -------------------------------------------------------------------
  putFile(file: NewFile): Promise<StoredFile>;
  /** Short-lived URL for a private object. */
  getFileUrl(key: string): Promise<string | null>;
  readFile(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;

  // Phone OTP (local fallback only; Supabase handles this natively) ---------
  saveOtp?(phone: string, code: string, expiresAt: string): Promise<void>;
  consumeOtp?(phone: string, code: string): Promise<boolean>;
}
