import { supabase } from '../lib/supabaseClient';
import {
  Patient,
  Consent,
  ConsentTemplate,
  ClinicSettings,
  PushNotification,
  ActivityLog,
  PatientNote,
} from '../types';
import { initialTemplates, initialClinicSettings } from '../data/initialData';
import { generateAndUploadConsentPdf } from '../utils/pdfGenerator';
import { uploadConsentSignature, uploadDoctorSignature } from '../lib/consentStorage';
import { normalizeTemplateCategory } from '../utils/consentHelpers';

export const PAGE_SIZE_PATIENTS = 40;
export const PAGE_SIZE_CONSENTS = 30;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string | undefined | null): id is string {
  return !!id && UUID_RE.test(id);
}

function errorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

/** Columnas sin signature_data (evita traer base64). signature_path es opcional en BD antigua. */
const CONSENT_LIST_COLUMNS =
  'id, patient_id, template_id, patient_name_snapshot, patient_dni_snapshot, title, category, template_version, content_snapshot, status, signature_path, signed_at, pdf_path, administration_number, administration_date, created_at, updated_at';

const CONSENT_LIST_COLUMNS_LEGACY =
  'id, patient_id, template_id, patient_name_snapshot, patient_dni_snapshot, title, category, template_version, content_snapshot, status, signed_at, pdf_path, created_at, updated_at';

// ── Mapping helpers: DB snake_case → App camelCase ────────────────────────────

function mapPatient(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    dni: row.dni as string,
    phone: row.phone as string,
    email: row.email as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapConsent(row: Record<string, unknown>): Consent {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    templateId: row.template_id as string,
    patientNameSnapshot: row.patient_name_snapshot as string,
    patientDniSnapshot: row.patient_dni_snapshot as string,
    title: row.title as string,
    category: row.category as string,
    templateVersion: row.template_version as number,
    contentSnapshot: row.content_snapshot as string,
    status: row.status as Consent['status'],
    signaturePath: (row.signature_path as string) || undefined,
    // Legacy: solo si aún existe en filas antiguas (no se solicita en listados)
    signatureData: (row.signature_data as string) || undefined,
    signedAt: (row.signed_at as string) || undefined,
    pdfPath: (row.pdf_path as string) || undefined,
    administrationNumber: (row.administration_number as string) || undefined,
    administrationDate: (row.administration_date as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPatientNote(row: Record<string, unknown>): PatientNote {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    noteDate: (row.note_date as string) || (row.created_at as string)?.slice(0, 10) || '',
    body: row.body as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTemplate(row: Record<string, unknown>): ConsentTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) || '',
    content: (row.content as string) || '',
    version: Number(row.version) || 1,
    // Si la columna no existe o viene null, tratar como activa
    active: row.active === false || row.active === 'false' ? false : true,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

function mapClinicSettings(row: Record<string, unknown>): ClinicSettings {
  return {
    id: row.id as number,
    clinicName: row.clinic_name as string,
    professionalName: row.professional_name as string,
    professionalTitle: (row.professional_title as string) || '',
    medicalLicense: (row.medical_license as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    logoUrl: (row.logo_url as string) || undefined,
    doctorSignaturePath: (row.doctor_signature_path as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapActivity(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    consentId: (row.consent_id as string) || undefined,
    patientId: (row.patient_id as string) || undefined,
    action: row.action as string,
    createdAt: row.created_at as string,
  };
}

// ── Service class ─────────────────────────────────────────────────────────────

type Listener = () => void;

class SupabaseService {
  private clinicSettings: ClinicSettings = initialClinicSettings;
  /** Vacío hasta cargar de Supabase — evita IDs demo (tmpl-101) que rompen el INSERT. */
  private patients: Patient[] = [];
  private consents: Consent[] = [];
  private templates: ConsentTemplate[] = [];
  private templatesSeedAttempted = false;
  private notifications: PushNotification[] = [];
  private activities: ActivityLog[] = [];
  private patientNotes: PatientNote[] = [];
  private listeners: Set<Listener> = new Set();
  private realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  private patientsOffset = 0;
  private consentsOffset = 0;
  private patientsHasMore = true;
  private consentsHasMore = true;
  private patientsQuery = '';
  private consentsQuery = '';
  private pendingCountCache = 0;
  private signedCountCache = 0;
  private totalConsentsCache = 0;
  private consentsSelectColumns = CONSENT_LIST_COLUMNS;
  private realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  /** IDs tocados localmente: no deben desaparecer en un refresh Realtime. */
  private pinnedConsentIds = new Set<string>();
  /** Evita que Realtime pise un alta/firma en curso. */
  private suppressRealtimeUntil = 0;

  private realtimeReady = false;

  constructor() {
    // No fetch aquí: RLS exige sesión. App llama reloadFromServer() tras login.
    void this.initRealtimeOnly();
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  private async initRealtimeOnly() {
    if (this.realtimeReady) return;
    this.subscribeRealtime();
    this.realtimeReady = true;
  }

  /**
   * Recarga pacientes, consentimientos y plantillas con la sesión actual.
   * Hay que llamarlo tras login (el constructor no tiene auth todavía).
   */
  public async reloadFromServer() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn('reloadFromServer: sin sesión autenticada todavía');
      return;
    }
    this.templatesSeedAttempted = false;
    await this.fetchAll();
    await this.initRealtimeOnly();
    this.notify();
  }

  private async fetchAll() {
    await Promise.all([
      this.fetchClinicSettings(),
      this.fetchPatientsPage(true),
      this.fetchConsentsPage(true),
      this.fetchTemplates(),
      this.fetchActivities(),
      this.refreshConsentCounts(),
    ]);
  }

  private async fetchClinicSettings() {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data) {
      this.clinicSettings = mapClinicSettings(data as Record<string, unknown>);
    }
  }

  private async fetchPatientsPage(reset: boolean) {
    if (reset) {
      this.patientsOffset = 0;
      this.patientsHasMore = true;
    }
    if (!this.patientsHasMore && !reset) return;

    let query = supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true })
      .range(this.patientsOffset, this.patientsOffset + PAGE_SIZE_PATIENTS - 1);

    const term = this.patientsQuery.trim();
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,dni.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching patients:', error);
      return;
    }

    const mapped = ((data || []) as Record<string, unknown>[]).map(mapPatient);
    this.patients = reset ? mapped : [...this.patients, ...mapped];
    this.patientsOffset += mapped.length;
    this.patientsHasMore = mapped.length === PAGE_SIZE_PATIENTS;
  }

  private async fetchConsentsPage(reset: boolean) {
    if (reset) {
      this.consentsOffset = 0;
      this.consentsHasMore = true;
    }
    if (!this.consentsHasMore && !reset) return;

    const runQuery = (columns: string) => {
      let query = supabase
        .from('consents')
        .select(columns)
        .order('created_at', { ascending: false })
        .range(this.consentsOffset, this.consentsOffset + PAGE_SIZE_CONSENTS - 1);

      const term = this.consentsQuery.trim();
      if (term) {
        query = query.or(
          `title.ilike.%${term}%,patient_name_snapshot.ilike.%${term}%,category.ilike.%${term}%`
        );
      }
      return query;
    };

    let { data, error } = await runQuery(this.consentsSelectColumns);

    // BD sin columnas nuevas (signature_path / administration_*) → legacy
    if (error && this.consentsSelectColumns !== CONSENT_LIST_COLUMNS_LEGACY) {
      console.warn('Columnas nuevas no disponibles; usando select legacy. Ejecuta la migración SQL.');
      this.consentsSelectColumns = CONSENT_LIST_COLUMNS_LEGACY;
      ({ data, error } = await runQuery(CONSENT_LIST_COLUMNS_LEGACY));
    }

    if (error) {
      console.error('Error fetching consents:', error);
      // No vaciar la lista en error: evita “se graba y desaparece”
      return;
    }

    const mapped = ((data || []) as unknown as Record<string, unknown>[]).map(mapConsent);

    if (reset) {
      const byId = new Map(mapped.map((c) => [c.id, c]));
      // Conservar consentimientos locales pinneados (alta/firma reciente) si el fetch aún no los trae
      for (const local of this.consents) {
        if (local.id.startsWith('temp-')) continue;
        if (this.pinnedConsentIds.has(local.id) && !byId.has(local.id)) {
          byId.set(local.id, local);
        }
      }
      this.consents = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      const existing = new Set(this.consents.map((c) => c.id));
      this.consents = [...this.consents, ...mapped.filter((c) => !existing.has(c.id))];
    }
    this.consentsOffset += mapped.length;
    this.consentsHasMore = mapped.length === PAGE_SIZE_CONSENTS;
  }

  private pinConsent(id: string) {
    if (!id || id.startsWith('temp-')) return;
    this.pinnedConsentIds.add(id);
    this.suppressRealtimeUntil = Date.now() + 2500;
    setTimeout(() => this.pinnedConsentIds.delete(id), 15000);
  }

  private scheduleConsentsRefresh() {
    if (Date.now() < this.suppressRealtimeUntil) return;
    if (this.realtimeRefreshTimer) clearTimeout(this.realtimeRefreshTimer);
    this.realtimeRefreshTimer = setTimeout(async () => {
      if (Date.now() < this.suppressRealtimeUntil) return;
      await Promise.all([this.fetchConsentsPage(true), this.refreshConsentCounts()]);
      this.notify();
    }, 600);
  }

  private async refreshConsentCounts() {
    const [pending, signed, total] = await Promise.all([
      supabase
        .from('consents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDIENTE'),
      supabase
        .from('consents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'FIRMADO'),
      supabase.from('consents').select('id', { count: 'exact', head: true }),
    ]);
    this.pendingCountCache = pending.count ?? 0;
    this.signedCountCache = signed.count ?? 0;
    this.totalConsentsCache = total.count ?? 0;
  }

  private lastTemplatesError: string | null = null;

  public getLastTemplatesError(): string | null {
    return this.lastTemplatesError;
  }

  private async fetchTemplates() {
    this.lastTemplatesError = null;
    const { data, error } = await supabase
      .from('consent_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      this.lastTemplatesError = errorMessage(error, 'Error al leer plantillas');
      this.templates = [];
      // Intentar sembrar igual (si el SELECT falla por vacío/RLS raro, el INSERT puede funcionar)
      if (!this.templatesSeedAttempted) {
        this.templatesSeedAttempted = true;
        await this.seedDefaultTemplates();
      }
      return;
    }

    if (data && data.length > 0) {
      this.templates = (data as unknown as Record<string, unknown>[]).map(mapTemplate);
      return;
    }

    // Clínica sin plantillas: sembrar las de ejemplo con UUID reales
    this.templates = [];
    if (!this.templatesSeedAttempted) {
      this.templatesSeedAttempted = true;
      await this.seedDefaultTemplates();
    }
  }

  /** Inserta plantillas de ejemplo si la tabla está vacía. Devuelve las cargadas. */
  public async ensureDefaultTemplates(): Promise<ConsentTemplate[]> {
    this.lastTemplatesError = null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      this.lastTemplatesError = 'Debes iniciar sesión para crear plantillas.';
      return [];
    }

    const { data, error } = await supabase
      .from('consent_templates')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      this.templates = (data as unknown as Record<string, unknown>[]).map(mapTemplate);
      this.notify();
      return this.getTemplates();
    }

    if (error) {
      this.lastTemplatesError = errorMessage(error, 'No se pueden leer plantillas');
    }

    this.templatesSeedAttempted = false;
    await this.seedDefaultTemplates();
    this.notify();
    return this.getTemplates();
  }

  private async seedDefaultTemplates() {
    const fullRows = initialTemplates.map((t) => ({
      name: t.name,
      category: normalizeTemplateCategory(t.category),
      content: t.content,
      version: t.version,
      active: true,
    }));
    // Variante mínima por si la BD no tiene columna active
    const minimalRows = initialTemplates.map((t) => ({
      name: t.name,
      category: normalizeTemplateCategory(t.category),
      content: t.content,
      version: t.version,
    }));

    const tryInsert = async (rows: Record<string, unknown>[]) => {
      // 1) INSERT sin RETURNING (evita fallo si SELECT RLS bloquea el returning)
      const { error: insertErr } = await supabase.from('consent_templates').insert(rows);
      if (insertErr) return insertErr;
      return null;
    };

    let err = await tryInsert(fullRows);
    if (err && /active|column/i.test(err.message || '')) {
      err = await tryInsert(minimalRows);
    }

    if (err) {
      console.error('Error seeding templates:', err);
      this.lastTemplatesError = errorMessage(
        err,
        'No se pudieron crear plantillas. Ejecuta el SQL de seed en Supabase.'
      );
      // Último recurso: una a una
      for (const row of fullRows) {
        const { error: oneErr } = await supabase.from('consent_templates').insert(row);
        if (oneErr) {
          const { error: minErr } = await supabase
            .from('consent_templates')
            .insert({
              name: row.name,
              category: row.category,
              content: row.content,
              version: row.version,
            });
          if (minErr) console.error('Error seeding template', row.name, minErr);
        }
      }
    }

    const { data, error: readErr } = await supabase
      .from('consent_templates')
      .select('*')
      .order('name', { ascending: true });

    if (readErr) {
      this.lastTemplatesError = errorMessage(
        readErr,
        'Plantillas creadas pero no se pueden leer (permisos RLS). Ejecuta 20261022_seed_consent_templates.sql'
      );
      return;
    }

    if (data && data.length > 0) {
      this.templates = (data as unknown as Record<string, unknown>[]).map(mapTemplate);
      this.lastTemplatesError = null;
    } else if (!this.lastTemplatesError) {
      this.lastTemplatesError =
        'La tabla de plantillas sigue vacía. Ejecuta en Supabase: supabase/migrations/20261022_seed_consent_templates.sql';
    }
  }

  private async fetchActivities() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data && data.length > 0) {
      this.activities = (data as Record<string, unknown>[]).map(mapActivity);
    }
  }

  // ── Realtime ─────────────────────────────────────────────────────────────────

  private subscribeRealtime() {
    this.realtimeChannel = supabase
      .channel('consentia-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, async () => {
        await this.fetchPatientsPage(true);
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consents' }, () => {
        this.scheduleConsentsRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, async () => {
        await this.fetchActivities();
        this.notify();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consent_templates' }, async () => {
        await this.fetchTemplates();
        this.notify();
      })
      .subscribe();
  }

  // ── Pub/Sub ───────────────────────────────────────────────────────────────────

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ── Clinic Settings ───────────────────────────────────────────────────────────

  public getClinicSettings(): ClinicSettings {
    return { ...this.clinicSettings };
  }

  public updateClinicSettings(updates: Partial<ClinicSettings>) {
    this.clinicSettings = { ...this.clinicSettings, ...updates };
    this.notify();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.clinicName !== undefined) dbUpdates.clinic_name = updates.clinicName;
    if (updates.professionalName !== undefined) dbUpdates.professional_name = updates.professionalName;
    if (updates.professionalTitle !== undefined) dbUpdates.professional_title = updates.professionalTitle;
    if (updates.medicalLicense !== undefined) dbUpdates.medical_license = updates.medicalLicense;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.doctorSignaturePath !== undefined) {
      dbUpdates.doctor_signature_path = updates.doctorSignaturePath;
    }

    if (Object.keys(dbUpdates).length > 0) {
      supabase
        .from('clinic_settings')
        .update(dbUpdates)
        .eq('id', 1)
        .then(({ error }) => {
          if (error) {
            // Columna doctor_signature_path aún no migrada
            if (updates.doctorSignaturePath && 'doctor_signature_path' in dbUpdates) {
              const { doctor_signature_path: _, ...rest } = dbUpdates;
              if (Object.keys(rest).length > 0) {
                void supabase.from('clinic_settings').update(rest).eq('id', 1);
              }
              console.warn(
                'doctor_signature_path no disponible. Ejecuta la migración SQL de firma doctora.'
              );
            } else {
              console.error('Error updating clinic_settings:', error);
            }
          }
        });
    }
  }

  /** Sube imagen de firma de la doctora y la guarda en clinic_settings. */
  public async setDoctorSignatureFromDataUrl(dataUrl: string): Promise<string | null> {
    const path = await uploadDoctorSignature(dataUrl);
    if (!path) return null;
    this.updateClinicSettings({ doctorSignaturePath: path });
    return path;
  }

  // ── Patients ──────────────────────────────────────────────────────────────────

  public getPatients(): Patient[] {
    return [...this.patients];
  }

  public hasMorePatients(): boolean {
    return this.patientsHasMore;
  }

  public async searchPatients(term: string) {
    this.patientsQuery = term;
    await this.fetchPatientsPage(true);
    this.notify();
  }

  public async loadMorePatients() {
    await this.fetchPatientsPage(false);
    this.notify();
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find((p) => p.id === id);
  }

  /** Alta de paciente esperando el UUID real de Supabase (evita FKs con temp-). */
  public async addPatientAsync(patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }): Promise<Patient> {
    const optimistic: Patient = {
      ...patientData,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.patients = [optimistic, ...this.patients];
    this.notify();

    const { data, error } = await supabase
      .from('patients')
      .insert({
        full_name: patientData.fullName,
        dni: patientData.dni,
        phone: patientData.phone,
        email: patientData.email,
      })
      .select('id, full_name, dni, phone, email, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('Error inserting patient:', error);
      this.patients = this.patients.filter((p) => p.id !== optimistic.id);
      this.notify();
      throw error || new Error('No se pudo registrar el cliente');
    }

    const persisted = mapPatient(data as Record<string, unknown>);
    this.patients = this.patients.map((p) => (p.id === optimistic.id ? persisted : p));
    this.notify();
    this.addInMemoryNotification({
      title: 'Nuevo Cliente Registrado',
      body: `${persisted.fullName} ha sido registrado/a en el sistema.`,
      type: 'new_client',
      relatedId: persisted.id,
    });
    this.addActivityLogInternal({
      action: `Nuevo paciente registrado: ${persisted.fullName}`,
    });
    return persisted;
  }

  /** @deprecated Prefer addPatientAsync — espera el UUID real. */
  public addPatient(patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }): Patient {
    // No duplicar: addPatientAsync ya inserta en lista
    let synced: Patient | null = null;
    void this.addPatientAsync(patientData).then((p) => {
      synced = p;
    });
    return (
      synced || {
        ...patientData,
        id: `temp-pending-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  // ── Consents ──────────────────────────────────────────────────────────────────

  public getConsents(): Consent[] {
    return [...this.consents];
  }

  public hasMoreConsents(): boolean {
    return this.consentsHasMore;
  }

  public getTotalConsentsCount(): number {
    return this.totalConsentsCache || this.consents.length;
  }

  public async searchConsents(term: string) {
    this.consentsQuery = term;
    await this.fetchConsentsPage(true);
    this.notify();
  }

  public async loadMoreConsents() {
    await this.fetchConsentsPage(false);
    this.notify();
  }

  public getPendingCount(): number {
    return this.pendingCountCache || this.consents.filter((c) => c.status === 'PENDIENTE').length;
  }

  public getSignedCount(): number {
    return this.signedCountCache || this.consents.filter((c) => c.status === 'FIRMADO').length;
  }

  /**
   * Crea el consentimiento y espera el UUID real.
   * Evita abrir el detalle con id temp- que luego “desaparece”.
   */
  public async createConsentAsync(data: {
    patientId: string;
    patientNameSnapshot: string;
    patientDniSnapshot: string;
    templateId: string;
    title: string;
    category: string;
    templateVersion: number;
    contentSnapshot: string;
  }): Promise<Consent> {
    if (!isUuid(data.patientId)) {
      throw new Error(
        'El cliente no está guardado en la base de datos. Crea o elige un cliente real e inténtalo de nuevo.'
      );
    }
    if (!isUuid(data.templateId)) {
      throw new Error(
        'La plantilla no es válida. Ve a Plantillas, crea una y vuelve a intentarlo.'
      );
    }

    // Preflight: confirmar que existen en BD (evita FK genérico)
    const [{ data: patientRow }, { data: templateRow }] = await Promise.all([
      supabase.from('patients').select('id').eq('id', data.patientId).maybeSingle(),
      supabase.from('consent_templates').select('id').eq('id', data.templateId).maybeSingle(),
    ]);
    if (!patientRow?.id) {
      throw new Error(
        'El cliente seleccionado no existe en la base de datos. Recarga y elige otro, o créalo de nuevo.'
      );
    }
    const templateExists = !!templateRow?.id;
    if (!templateExists) {
      console.warn('Plantilla no encontrada en BD; se generará el consentimiento sin template_id.');
    }

    const category = normalizeTemplateCategory(data.category);

    const optimistic: Consent = {
      ...data,
      category,
      id: `temp-${Date.now()}`,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.consents = [optimistic, ...this.consents];
    this.notify();

    const basePayload: Record<string, unknown> = {
      patient_id: data.patientId,
      patient_name_snapshot: data.patientNameSnapshot,
      patient_dni_snapshot: data.patientDniSnapshot,
      title: data.title,
      category,
      template_version: data.templateVersion,
      content_snapshot: data.contentSnapshot,
      status: 'PENDIENTE',
    };
    if (templateExists) {
      basePayload.template_id = data.templateId;
    }

    // INSERT mínimo (solo id). Luego leemos la fila completa.
    let { data: inserted, error: insertError } = await supabase
      .from('consents')
      .insert(basePayload)
      .select('id')
      .single();

    // Si falla por template_id (FK / NOT NULL / check), reintentar sin plantilla
    if (
      insertError &&
      templateExists &&
      /template_id|foreign key|violates/i.test(insertError.message || '')
    ) {
      const { template_id: _t, ...withoutTemplate } = basePayload;
      ({ data: inserted, error: insertError } = await supabase
        .from('consents')
        .insert(withoutTemplate)
        .select('id')
        .single());
    }

    // Si falla por categoría CHECK en consents, reintentar con categoría por defecto
    if (insertError && /category|check/i.test(insertError.message || '')) {
      const retryPayload = {
        ...basePayload,
        category: 'Tratamiento estético facial',
        ...(templateExists ? { template_id: data.templateId } : {}),
      };
      ({ data: inserted, error: insertError } = await supabase
        .from('consents')
        .insert(retryPayload)
        .select('id')
        .single());
    }

    if (insertError || !inserted?.id) {
      console.error('Error inserting consent:', insertError);
      this.consents = this.consents.filter((c) => c.id !== optimistic.id);
      this.notify();
      const msg = errorMessage(insertError, 'No se pudo crear el consentimiento');
      const details =
        typeof insertError === 'object' && insertError && 'details' in insertError
          ? String((insertError as { details?: string }).details || '')
          : '';
      const combined = `${msg} ${details}`;
      if (/patient_id/i.test(combined)) {
        throw new Error(
          'El cliente no existe en la base de datos. Recarga y vuelve a seleccionarlo.'
        );
      }
      if (/template_id/i.test(combined)) {
        throw new Error(
          'La plantilla no existe en la base de datos. Ve a Plantillas, crea una y vuelve.'
        );
      }
      if (/foreign key|violates/i.test(combined)) {
        throw new Error(
          'No se pudo vincular cliente o plantilla. Recarga la página, vuelve a elegirlos e inténtalo de nuevo.'
        );
      }
      if (/permission denied|row-level security|RLS/i.test(combined)) {
        throw new Error(
          'Sin permiso para crear consentimientos. Revisa que hayas iniciado sesión y la migración RLS en Supabase.'
        );
      }
      throw new Error(msg);
    }

    const realId = inserted.id as string;
    this.pinConsent(realId);

    let row: Record<string, unknown> | null = null;
    let { data: full, error: selectError } = await supabase
      .from('consents')
      .select(CONSENT_LIST_COLUMNS_LEGACY)
      .eq('id', realId)
      .single();

    if (selectError || !full) {
      console.warn('Select post-insert falló; usando datos locales + id real:', selectError);
      row = {
        id: realId,
        patient_id: data.patientId,
        template_id: data.templateId,
        patient_name_snapshot: data.patientNameSnapshot,
        patient_dni_snapshot: data.patientDniSnapshot,
        title: data.title,
        category: data.category,
        template_version: data.templateVersion,
        content_snapshot: data.contentSnapshot,
        status: 'PENDIENTE',
        created_at: optimistic.createdAt,
        updated_at: optimistic.updatedAt,
      };
    } else {
      row = full as Record<string, unknown>;
    }

    const persisted = mapConsent(row);
    this.consents = this.consents
      .filter((c) => c.id !== optimistic.id && c.id !== persisted.id)
      .concat(persisted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.notify();

    this.addInMemoryNotification({
      title: 'Nuevo Consentimiento Creado',
      body: `Consentimiento "${persisted.title}" generado para ${persisted.patientNameSnapshot}.`,
      type: 'system',
      relatedId: persisted.id,
    });
    this.addActivityLogInternal({
      action: `Consentimiento creado: ${persisted.title} — ${persisted.patientNameSnapshot}`,
      consentId: persisted.id,
      patientId: persisted.patientId,
    });
    await this.refreshConsentCounts();
    this.notify();

    return persisted;
  }

  public createConsent(data: {
    patientId: string;
    patientNameSnapshot: string;
    patientDniSnapshot: string;
    templateId: string;
    title: string;
    category: string;
    templateVersion: number;
    contentSnapshot: string;
  }): Consent {
    void this.createConsentAsync(data).catch((err) => console.error(err));
    return {
      ...data,
      id: `temp-pending-${Date.now()}`,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public signConsent(id: string, signatureData: string): Consent | undefined {
    if (id.startsWith('temp-')) {
      console.error('No se puede firmar un consentimiento que aún no está guardado.');
      return undefined;
    }

    const consent = this.consents.find((c) => c.id === id);
    if (!consent) return undefined;

    this.pinConsent(id);

    const signedAt = new Date().toISOString();
    const updated: Consent = {
      ...consent,
      status: 'FIRMADO',
      signedAt,
      signatureData,
      updatedAt: signedAt,
    };
    this.consents = this.consents.map((c) => (c.id === id ? updated : c));
    this.notify();

    void (async () => {
      let signaturePath: string | null = null;
      try {
        signaturePath = await uploadConsentSignature(id, signatureData);
      } catch (err) {
        console.warn('Upload firma falló; se guarda el estado FIRMADO igual:', err);
      }

      // Intentar update completo; degradar columnas si la BD aún no las tiene
      const attempts: Record<string, unknown>[] = [
        {
          status: 'FIRMADO',
          signed_at: signedAt,
          ...(signaturePath ? { signature_path: signaturePath } : {}),
          signature_data: null,
        },
        {
          status: 'FIRMADO',
          signed_at: signedAt,
          ...(signaturePath ? { signature_path: signaturePath } : {}),
        },
        { status: 'FIRMADO', signed_at: signedAt, signature_data: null },
        { status: 'FIRMADO', signed_at: signedAt },
      ];

      let saved = false;
      for (const dbUpdate of attempts) {
        const { error } = await supabase.from('consents').update(dbUpdate).eq('id', id);
        if (!error) {
          saved = true;
          if (!('signature_path' in dbUpdate) && signaturePath) {
            console.warn('Firmado sin signature_path. Ejecuta la migración SQL en Supabase.');
          }
          break;
        }
      }

      if (!saved) {
        console.error('Error signing consent: todos los intentos de UPDATE fallaron');
        // Mantener FIRMADO en UI (ya pinneado); no borrar el documento
        return;
      }

      const forPdf: Consent = {
        ...updated,
        signaturePath: signaturePath || undefined,
        signatureData,
      };

      const res = await generateAndUploadConsentPdf(forPdf, this.clinicSettings);
      const cleared: Consent = {
        ...forPdf,
        // Conservar data URL en memoria si no hay path en Storage (sigue visible en detalle)
        signatureData: signaturePath ? undefined : signatureData,
        signaturePath: signaturePath || undefined,
        pdfPath: res?.pdfPath || forPdf.pdfPath,
      };
      this.consents = this.consents.map((c) => (c.id === id ? cleared : c));
      this.notify();

      if (res?.pdfPath) {
        const { error: pdfErr } = await supabase
          .from('consents')
          .update({
            pdf_path: res.pdfPath,
            pdf_size: res.pdfSize,
            pdf_created_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (pdfErr) console.warn('Warning updating pdf_path:', pdfErr.message);
      }

      await this.refreshConsentCounts();
      this.notify();
    })();

    this.addActivityLogInternal({
      action: `Consentimiento firmado: ${updated.title} — ${updated.patientNameSnapshot}`,
      consentId: updated.id,
      patientId: updated.patientId,
    });

    this.addInMemoryNotification({
      title: '⚡ ¡Consentimiento Firmado!',
      body: `${updated.patientNameSnapshot} acaba de firmar "${updated.title}".`,
      type: 'signature',
      relatedId: updated.id,
    });

    return updated;
  }

  /**
   * Una sola firma del paciente aplicada a varios consentimientos pendientes
   * de la misma sesión (misma firma, un PDF por documento).
   */
  public signConsentsBatch(ids: string[], signatureData: string): Consent[] {
    const unique = [...new Set(ids.filter((id) => id && !id.startsWith('temp-')))];
    const signed: Consent[] = [];
    for (const id of unique) {
      const result = this.signConsent(id, signatureData);
      if (result) signed.push(result);
    }
    if (signed.length > 1) {
      this.addActivityLogInternal({
        action: `Firma en lote: ${signed.length} consentimientos — ${signed[0].patientNameSnapshot}`,
        patientId: signed[0].patientId,
      });
    }
    return signed;
  }

  public async updateConsentAdministration(
    id: string,
    fields: { administrationNumber?: string; administrationDate?: string }
  ): Promise<Consent | undefined> {
    const existing = this.consents.find((c) => c.id === id);
    if (!existing) return undefined;

    const updated: Consent = {
      ...existing,
      administrationNumber:
        fields.administrationNumber !== undefined
          ? fields.administrationNumber || undefined
          : existing.administrationNumber,
      administrationDate:
        fields.administrationDate !== undefined
          ? fields.administrationDate || undefined
          : existing.administrationDate,
      updatedAt: new Date().toISOString(),
    };
    this.consents = this.consents.map((c) => (c.id === id ? updated : c));
    this.notify();

    const dbUpdate: Record<string, unknown> = {
      updated_at: updated.updatedAt,
    };
    if (fields.administrationNumber !== undefined) {
      dbUpdate.administration_number = fields.administrationNumber || null;
    }
    if (fields.administrationDate !== undefined) {
      dbUpdate.administration_date = fields.administrationDate || null;
    }

    const { error } = await supabase.from('consents').update(dbUpdate).eq('id', id);
    if (error) {
      console.warn('No se pudieron guardar campos de administración (¿migración SQL?):', error.message);
    }
    return updated;
  }

  // ── Patient notes ─────────────────────────────────────────────────────────────

  public getPatientNotes(patientId: string): PatientNote[] {
    return this.patientNotes
      .filter((n) => n.patientId === patientId)
      .sort((a, b) => {
        const d = b.noteDate.localeCompare(a.noteDate);
        if (d !== 0) return d;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  public async fetchPatientNotes(patientId: string): Promise<PatientNote[]> {
    if (!isUuid(patientId)) return [];
    const { data, error } = await supabase
      .from('patient_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching patient_notes (¿migración SQL?):', error.message);
      return this.getPatientNotes(patientId);
    }

    const mapped = ((data || []) as unknown as Record<string, unknown>[]).map(mapPatientNote);
    this.patientNotes = [
      ...this.patientNotes.filter((n) => n.patientId !== patientId),
      ...mapped,
    ];
    this.notify();
    return mapped;
  }

  public async addPatientNote(
    patientId: string,
    body: string,
    noteDate?: string
  ): Promise<PatientNote> {
    if (!isUuid(patientId)) throw new Error('Paciente no válido');
    const trimmed = body.trim();
    if (!trimmed) throw new Error('La nota no puede estar vacía');

    const date = noteDate || new Date().toISOString().slice(0, 10);
    const optimistic: PatientNote = {
      id: `temp-note-${Date.now()}`,
      patientId,
      noteDate: date,
      body: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.patientNotes = [optimistic, ...this.patientNotes];
    this.notify();

    const { data, error } = await supabase
      .from('patient_notes')
      .insert({
        patient_id: patientId,
        note_date: date,
        body: trimmed,
      })
      .select('*')
      .single();

    if (error || !data) {
      this.patientNotes = this.patientNotes.filter((n) => n.id !== optimistic.id);
      this.notify();
      throw error || new Error('No se pudo guardar la nota. Ejecuta la migración SQL.');
    }

    const persisted = mapPatientNote(data as Record<string, unknown>);
    this.patientNotes = this.patientNotes.map((n) =>
      n.id === optimistic.id ? persisted : n
    );
    this.notify();
    return persisted;
  }

  public async deletePatientNote(noteId: string): Promise<void> {
    const prev = this.patientNotes;
    this.patientNotes = this.patientNotes.filter((n) => n.id !== noteId);
    this.notify();
    if (noteId.startsWith('temp-')) return;
    const { error } = await supabase.from('patient_notes').delete().eq('id', noteId);
    if (error) {
      console.error('Error deleting note:', error);
      this.patientNotes = prev;
      this.notify();
    }
  }

  // ── Consent Templates ─────────────────────────────────────────────────────────

  public getTemplates(): ConsentTemplate[] {
    return [...this.templates];
  }

  public addTemplate(data: {
    name: string;
    category: string;
    content: string;
    version?: number;
  }): ConsentTemplate {
    const version = data.version || 1;
    const category = normalizeTemplateCategory(data.category);
    const optimistic: ConsentTemplate = {
      id: `temp-${Date.now()}`,
      name: data.name,
      category,
      content: data.content,
      version,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates = [...this.templates, optimistic];
    this.notify();

    supabase
      .from('consent_templates')
      .insert({
        name: data.name,
        category,
        content: data.content,
        version,
        active: true,
      })
      .select()
      .single()
      .then(({ data: row, error }) => {
        if (error) {
          console.error('Error inserting template:', error);
          return;
        }
        if (row) {
          const persisted = mapTemplate(row as Record<string, unknown>);
          this.templates = this.templates.map((t) => (t.id === optimistic.id ? persisted : t));
          this.notify();
          this.addActivityLogInternal({
            action: `Nueva plantilla creada: ${persisted.name}`,
          });
        }
      });

    return optimistic;
  }

  public updateTemplate(
    id: string,
    updates: Partial<{ name: string; category: string; content: string; active: boolean; version: number }>
  ) {
    const existing = this.templates.find((t) => t.id === id);
    if (!existing) return;

    const updated: ConsentTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.templates = this.templates.map((t) => (t.id === id ? updated : t));
    this.notify();

    const dbUpdates: Record<string, unknown> = {
      updated_at: updated.updatedAt,
    };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.version !== undefined) dbUpdates.version = updates.version;

    supabase
      .from('consent_templates')
      .update(dbUpdates)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Error updating template:', error);
      });

    this.addActivityLogInternal({
      action: `Plantilla actualizada: ${updated.name}`,
    });
  }

  public toggleTemplateActive(id: string, active: boolean) {
    this.updateTemplate(id, { active });
  }

  // ── In-memory Notifications ───────────────────────────────────────────────────

  public getNotifications(): PushNotification[] {
    return [...this.notifications];
  }

  public getUnreadNotificationsCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notify();
  }

  public markAllNotificationsAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
  }

  private addInMemoryNotification(data: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) {
    const notification: PushNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    this.notifications = [notification, ...this.notifications];
    this.notify();
  }

  public simulateIncomingPush() {
    this.addInMemoryNotification({
      title: '⚡ Supabase Realtime: Documento Firmado',
      body: 'Nueva firma biométrica procesada en la nube.',
      type: 'signature',
    });
  }

  // ── Activity Logs ─────────────────────────────────────────────────────────────

  public getActivities(): ActivityLog[] {
    return [...this.activities];
  }

  private addActivityLogInternal(log: {
    action: string;
    consentId?: string;
    patientId?: string;
  }) {
    const optimistic: ActivityLog = {
      ...log,
      id: `temp-act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.activities = [optimistic, ...this.activities.slice(0, 19)];
    this.notify();

    supabase
      .from('activity_logs')
      .insert({
        action: log.action,
        consent_id: log.consentId || null,
        patient_id: log.patientId || null,
      })
      .then(({ error }) => {
        if (error) console.error('Error inserting activity log:', error);
      });
  }
}

export const supabaseService = new SupabaseService();
