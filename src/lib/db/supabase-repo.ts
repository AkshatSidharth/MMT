import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
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

/** Signed URL lifetime for private medical and identity documents. */
const SIGNED_URL_TTL_SECONDS = 60 * 10;

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, context: string) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

function unwrapList<T>(
  result: { data: T[] | null; error: { message: string } | null },
  context: string,
) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data ?? [];
}

/**
 * Supabase-backed implementation. Server actions and route handlers have already
 * authorised the caller, so this uses the service role; the RLS policies in
 * supabase/migrations additionally protect any direct client-side access.
 */
export class SupabaseRepo implements Repo {
  readonly kind = "supabase" as const;

  private get client(): SupabaseClient {
    return createSupabaseAdminClient();
  }

  // Users -------------------------------------------------------------------
  async getUser(id: string) {
    const result = await this.client.from("users").select("*").eq("id", id).maybeSingle();
    return unwrap<User>(result, "getUser");
  }

  async getUserByEmail(email: string) {
    const result = await this.client
      .from("users")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();
    return unwrap<User>(result, "getUserByEmail");
  }

  async getUserByPhone(phone: string) {
    const result = await this.client
      .from("users")
      .select("*")
      .eq("phone", phone.replace(/\s/g, ""))
      .maybeSingle();
    return unwrap<User>(result, "getUserByPhone");
  }

  async createUser(input: Parameters<Repo["createUser"]>[0]) {
    const result = await this.client
      .from("users")
      .insert({
        ...(input.id ? { id: input.id } : {}),
        email: input.email ?? null,
        phone: input.phone ?? null,
        full_name: input.full_name ?? null,
        role: input.role ?? "patient",
        language: input.language ?? "en",
      })
      .select("*")
      .single();
    return unwrap<User>(result, "createUser")!;
  }

  async updateUser(id: string, patch: Partial<User>) {
    const result = await this.client
      .from("users")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<User>(result, "updateUser")!;
  }

  async listAdmins() {
    const result = await this.client
      .from("users")
      .select("*")
      .eq("role", "admin")
      .order("full_name");
    return unwrapList<User>(result, "listAdmins");
  }

  // Patient profiles --------------------------------------------------------
  async getProfile(userId: string) {
    const result = await this.client
      .from("patient_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return unwrap<PatientProfile>(result, "getProfile");
  }

  async upsertProfile(userId: string, patch: Partial<PatientProfile>) {
    const result = await this.client
      .from("patient_profiles")
      .upsert(
        { ...patch, user_id: userId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    return unwrap<PatientProfile>(result, "upsertProfile")!;
  }

  // Treatments --------------------------------------------------------------
  async listTreatments() {
    const result = await this.client
      .from("treatments")
      .select("*")
      .order("category")
      .order("name");
    return unwrapList<Treatment>(result, "listTreatments");
  }

  async getTreatment(id: string) {
    const result = await this.client.from("treatments").select("*").eq("id", id).maybeSingle();
    return unwrap<Treatment>(result, "getTreatment");
  }

  async getTreatmentBySlug(slug: string) {
    const result = await this.client.from("treatments").select("*").eq("slug", slug).maybeSingle();
    return unwrap<Treatment>(result, "getTreatmentBySlug");
  }

  async createTreatment(input: Omit<Treatment, "id" | "created_at">) {
    const result = await this.client.from("treatments").insert(input).select("*").single();
    return unwrap<Treatment>(result, "createTreatment")!;
  }

  async updateTreatment(id: string, patch: Partial<Treatment>) {
    const result = await this.client
      .from("treatments")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<Treatment>(result, "updateTreatment")!;
  }

  async deleteTreatment(id: string) {
    const { error } = await this.client.from("treatments").delete().eq("id", id);
    if (error) throw new Error(`deleteTreatment: ${error.message}`);
  }

  // Hospitals ---------------------------------------------------------------
  async listHospitals(filter: HospitalFilter = {}) {
    let query = this.client.from("hospitals").select("*").order("name");
    if (filter.city) query = query.eq("city", filter.city);
    if (filter.specialty) query = query.contains("specialties", [filter.specialty]);
    if (filter.accreditation) query = query.contains("accreditation", [filter.accreditation]);
    if (filter.treatmentSlug) query = query.contains("treatment_slugs", [filter.treatmentSlug]);
    if (filter.query) query = query.or(`name.ilike.%${filter.query}%,city.ilike.%${filter.query}%`);
    return unwrapList<Hospital>(await query, "listHospitals");
  }

  async getHospital(id: string) {
    const result = await this.client.from("hospitals").select("*").eq("id", id).maybeSingle();
    return unwrap<Hospital>(result, "getHospital");
  }

  async getHospitalBySlug(slug: string) {
    const result = await this.client.from("hospitals").select("*").eq("slug", slug).maybeSingle();
    return unwrap<Hospital>(result, "getHospitalBySlug");
  }

  async createHospital(input: Omit<Hospital, "id" | "created_at">) {
    const result = await this.client.from("hospitals").insert(input).select("*").single();
    return unwrap<Hospital>(result, "createHospital")!;
  }

  async updateHospital(id: string, patch: Partial<Hospital>) {
    const result = await this.client
      .from("hospitals")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<Hospital>(result, "updateHospital")!;
  }

  async deleteHospital(id: string) {
    const { error } = await this.client.from("hospitals").delete().eq("id", id);
    if (error) throw new Error(`deleteHospital: ${error.message}`);
  }

  // Doctors -----------------------------------------------------------------
  async listDoctors(hospitalId?: string) {
    let query = this.client.from("doctors").select("*").order("name");
    if (hospitalId) query = query.eq("hospital_id", hospitalId);
    return unwrapList<Doctor>(await query, "listDoctors");
  }

  async getDoctor(id: string) {
    const result = await this.client.from("doctors").select("*").eq("id", id).maybeSingle();
    return unwrap<Doctor>(result, "getDoctor");
  }

  async createDoctor(input: Omit<Doctor, "id" | "created_at">) {
    const result = await this.client.from("doctors").insert(input).select("*").single();
    return unwrap<Doctor>(result, "createDoctor")!;
  }

  async updateDoctor(id: string, patch: Partial<Doctor>) {
    const result = await this.client
      .from("doctors")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<Doctor>(result, "updateDoctor")!;
  }

  async deleteDoctor(id: string) {
    const { error } = await this.client.from("doctors").delete().eq("id", id);
    if (error) throw new Error(`deleteDoctor: ${error.message}`);
  }

  // Cases -------------------------------------------------------------------
  private readonly caseSelect = `
    *,
    patient:users!medical_cases_patient_id_fkey(*),
    assigned_admin:users!medical_cases_assigned_admin_id_fkey(*),
    treatment:treatments(*),
    documents(*),
    matches(*, hospital:hospitals(*)),
    consultations(*)
  `;

  private async hydrate(row: Record<string, unknown>): Promise<CaseWithRelations> {
    const patientId = row.patient_id as string;
    const [profile, messageCount] = await Promise.all([
      this.getProfile(patientId),
      this.client
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("case_id", row.id as string),
    ]);

    // `consultations` is a one-row array from the embed; flatten it off the case.
    const { consultations, ...rest } = row as { consultations?: Consultation[] } & Record<
      string,
      unknown
    >;

    return {
      ...(rest as unknown as MedicalCase),
      patient: (row.patient as User | null) ?? null,
      assigned_admin: (row.assigned_admin as User | null) ?? null,
      treatment: (row.treatment as Treatment | null) ?? null,
      profile,
      documents: ((row.documents as CaseDocument[] | null) ?? []).sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
      matches: (row.matches as CaseWithRelations["matches"] | null) ?? [],
      consultation: consultations?.[0] ?? null,
      message_count: messageCount.count ?? 0,
    };
  }

  async listCases(filter: CaseFilter = {}) {
    let query = this.client
      .from("medical_cases")
      .select(this.caseSelect)
      .order("created_at", { ascending: false });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.assignedAdminId) query = query.eq("assigned_admin_id", filter.assignedAdminId);
    if (filter.query) query = query.ilike("reference", `%${filter.query}%`);

    const rows = unwrapList<Record<string, unknown>>(await query, "listCases");
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async listCasesByPatient(patientId: string) {
    const result = await this.client
      .from("medical_cases")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    return unwrapList<MedicalCase>(result, "listCasesByPatient");
  }

  async getCase(id: string) {
    const result = await this.client
      .from("medical_cases")
      .select(this.caseSelect)
      .eq("id", id)
      .maybeSingle();
    const row = unwrap<Record<string, unknown>>(result, "getCase");
    return row ? this.hydrate(row) : null;
  }

  async createCase(input: Parameters<Repo["createCase"]>[0]) {
    // `reference` is assigned by a Postgres sequence + trigger (see migration).
    const result = await this.client.from("medical_cases").insert(input).select("*").single();
    return unwrap<MedicalCase>(result, "createCase")!;
  }

  async updateCase(id: string, patch: Partial<MedicalCase>) {
    const result = await this.client
      .from("medical_cases")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<MedicalCase>(result, "updateCase")!;
  }

  // Documents ---------------------------------------------------------------
  async listDocuments(filter: { caseId?: string; patientId?: string }) {
    let query = this.client
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter.caseId) query = query.eq("case_id", filter.caseId);
    if (filter.patientId) query = query.eq("patient_id", filter.patientId);
    return unwrapList<CaseDocument>(await query, "listDocuments");
  }

  async getDocument(id: string) {
    const result = await this.client.from("documents").select("*").eq("id", id).maybeSingle();
    return unwrap<CaseDocument>(result, "getDocument");
  }

  async getDocumentByKey(key: string) {
    const result = await this.client
      .from("documents")
      .select("*")
      .eq("file_url", key)
      .maybeSingle();
    return unwrap<CaseDocument>(result, "getDocumentByKey");
  }

  async createDocument(input: Omit<CaseDocument, "id" | "created_at">) {
    const result = await this.client.from("documents").insert(input).select("*").single();
    return unwrap<CaseDocument>(result, "createDocument")!;
  }

  async deleteDocument(id: string) {
    const document = await this.getDocument(id);
    const { error } = await this.client.from("documents").delete().eq("id", id);
    if (error) throw new Error(`deleteDocument: ${error.message}`);
    if (document) {
      const [bucket, ...rest] = document.file_url.split("/");
      await this.client.storage.from(bucket).remove([rest.join("/")]);
    }
  }

  // Matches -----------------------------------------------------------------
  async listMatches(caseId: string) {
    const result = await this.client
      .from("matches")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    return unwrapList<Match>(result, "listMatches");
  }

  async getMatch(id: string) {
    const result = await this.client.from("matches").select("*").eq("id", id).maybeSingle();
    return unwrap<Match>(result, "getMatch");
  }

  async createMatch(input: Omit<Match, "id" | "created_at">) {
    const result = await this.client.from("matches").insert(input).select("*").single();
    return unwrap<Match>(result, "createMatch")!;
  }

  async updateMatch(id: string, patch: Partial<Match>) {
    const result = await this.client
      .from("matches")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    return unwrap<Match>(result, "updateMatch")!;
  }

  async deleteMatch(id: string) {
    const { error } = await this.client.from("matches").delete().eq("id", id);
    if (error) throw new Error(`deleteMatch: ${error.message}`);
  }

  // Consultations -----------------------------------------------------------
  async getConsultation(caseId: string) {
    const result = await this.client
      .from("consultations")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();
    return unwrap<Consultation>(result, "getConsultation");
  }

  async upsertConsultation(
    caseId: string,
    input: Omit<Consultation, "id" | "created_at" | "case_id">,
  ) {
    const result = await this.client
      .from("consultations")
      .upsert({ ...input, case_id: caseId }, { onConflict: "case_id" })
      .select("*")
      .single();
    return unwrap<Consultation>(result, "upsertConsultation")!;
  }

  // Messages ----------------------------------------------------------------
  async listMessages(caseId: string) {
    const result = await this.client
      .from("messages")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at");
    return unwrapList<Message>(result, "listMessages");
  }

  async createMessage(input: Omit<Message, "id" | "created_at">) {
    const result = await this.client.from("messages").insert(input).select("*").single();
    return unwrap<Message>(result, "createMessage")!;
  }

  // Leads -------------------------------------------------------------------
  async listLeads() {
    const result = await this.client
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    return unwrapList<Lead>(result, "listLeads");
  }

  async createLead(input: Omit<Lead, "id" | "created_at">) {
    const result = await this.client.from("leads").insert(input).select("*").single();
    return unwrap<Lead>(result, "createLead")!;
  }

  async updateLead(id: string, patch: Partial<Lead>) {
    const result = await this.client.from("leads").update(patch).eq("id", id).select("*").single();
    return unwrap<Lead>(result, "updateLead")!;
  }

  // Files -------------------------------------------------------------------
  async putFile(file: NewFile): Promise<StoredFile> {
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const objectPath = `${crypto.randomUUID()}-${safeName}`;
    const { error } = await this.client.storage
      .from(file.bucket)
      .upload(objectPath, file.bytes, { contentType: file.contentType, upsert: false });
    if (error) throw new Error(`putFile: ${error.message}`);
    return { key: `${file.bucket}/${objectPath}`, size: file.bytes.byteLength };
  }

  async getFileUrl(key: string) {
    const [bucket, ...rest] = key.split("/");
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(rest.join("/"), SIGNED_URL_TTL_SECONDS);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  async readFile(key: string) {
    const [bucket, ...rest] = key.split("/");
    const { data, error } = await this.client.storage.from(bucket).download(rest.join("/"));
    if (error || !data) return null;
    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      contentType: data.type || "application/octet-stream",
    };
  }
}
