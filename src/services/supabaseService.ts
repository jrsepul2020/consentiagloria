import { supabase } from '../lib/supabaseClient';
import {
  Patient,
  Consent,
  ConsentTemplate,
  ClinicSettings,
  PushNotification,
  ActivityLog,
} from '../types';
import {
  initialPatients,
  initialConsents,
  initialTemplates,
  initialClinicSettings,
} from '../data/initialData';
import { generateAndUploadConsentPdf } from '../utils/pdfGenerator';
import { uploadConsentSignature } from '../lib/consentStorage';

export const PAGE_SIZE_PATIENTS = 40;
export const PAGE_SIZE_CONSENTS = 30;

/** Columnas de consentimiento sin signature_data (evita traer base64 pesado). */
const CONSENT_LIST_COLUMNS =
  'id, patient_id, template_id, patient_name_snapshot, patient_dni_snapshot, title, category, template_version, content_snapshot, status, signature_path, signed_at, pdf_path, created_at, updated_at';

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
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTemplate(row: Record<string, unknown>): ConsentTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    content: row.content as string,
    version: row.version as number,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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
  private patients: Patient[] = initialPatients;
  private consents: Consent[] = initialConsents;
  private templates: ConsentTemplate[] = initialTemplates;
  private notifications: PushNotification[] = [];
  private activities: ActivityLog[] = [];
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

  constructor() {
    this.init();
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  private async init() {
    await this.fetchAll();
    this.subscribeRealtime();
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

    let query = supabase
      .from('consents')
      .select(CONSENT_LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .range(this.consentsOffset, this.consentsOffset + PAGE_SIZE_CONSENTS - 1);

    const term = this.consentsQuery.trim();
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,patient_name_snapshot.ilike.%${term}%,category.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching consents:', error);
      return;
    }

    const mapped = ((data || []) as Record<string, unknown>[]).map(mapConsent);
    this.consents = reset ? mapped : [...this.consents, ...mapped];
    this.consentsOffset += mapped.length;
    this.consentsHasMore = mapped.length === PAGE_SIZE_CONSENTS;
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

  private async fetchTemplates() {
    const { data, error } = await supabase
      .from('consent_templates')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data && data.length > 0) {
      this.templates = (data as Record<string, unknown>[]).map(mapTemplate);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consents' }, async () => {
        await Promise.all([this.fetchConsentsPage(true), this.refreshConsentCounts()]);
        this.notify();
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

    if (Object.keys(dbUpdates).length > 0) {
      supabase
        .from('clinic_settings')
        .update(dbUpdates)
        .eq('id', 1)
        .then(({ error }) => {
          if (error) console.error('Error updating clinic_settings:', error);
        });
    }
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

  public addPatient(patientData: {
    fullName: string;
    dni: string;
    phone: string;
    email: string;
  }): Patient {
    const optimistic: Patient = {
      ...patientData,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.patients = [optimistic, ...this.patients];
    this.notify();

    supabase
      .from('patients')
      .insert({
        full_name: patientData.fullName,
        dni: patientData.dni,
        phone: patientData.phone,
        email: patientData.email,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error inserting patient:', error);
          return;
        }
        if (data) {
          const persisted = mapPatient(data as Record<string, unknown>);
          this.patients = this.patients.map((p) =>
            p.id === optimistic.id ? persisted : p
          );
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
        }
      });

    return optimistic;
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
    const optimistic: Consent = {
      ...data,
      id: `temp-${Date.now()}`,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.consents = [optimistic, ...this.consents];
    this.notify();

    supabase
      .from('consents')
      .insert({
        patient_id: data.patientId,
        template_id: data.templateId,
        patient_name_snapshot: data.patientNameSnapshot,
        patient_dni_snapshot: data.patientDniSnapshot,
        title: data.title,
        category: data.category,
        template_version: data.templateVersion,
        content_snapshot: data.contentSnapshot,
        status: 'PENDIENTE',
      })
      .select()
      .single()
      .then(({ data: row, error }) => {
        if (error) { console.error('Error inserting consent:', error); return; }
        if (row) {
          const persisted = mapConsent(row as Record<string, unknown>);
          this.consents = this.consents.map((c) =>
            c.id === optimistic.id ? persisted : c
          );
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
          this.notify();
        }
      });

    return optimistic;
  }

  public signConsent(id: string, signatureData: string): Consent | undefined {
    const consent = this.consents.find((c) => c.id === id);
    if (!consent) return undefined;

    const signedAt = new Date().toISOString();
    // Firma en memoria solo para generar el PDF de esta sesión; no se persiste en BD
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
      const signaturePath = await uploadConsentSignature(id, signatureData);

      const dbUpdate: Record<string, unknown> = {
        status: 'FIRMADO',
        signed_at: signedAt,
        signature_data: null, // no guardar base64 en la tabla
      };
      if (signaturePath) dbUpdate.signature_path = signaturePath;

      const { error } = await supabase.from('consents').update(dbUpdate).eq('id', id);
      if (error) console.error('Error signing consent:', error);

      const forPdf: Consent = {
        ...updated,
        signaturePath: signaturePath || undefined,
        signatureData, // data URL local para embeber en PDF ahora
      };

      const res = await generateAndUploadConsentPdf(forPdf, this.clinicSettings);
      const cleared: Consent = {
        ...forPdf,
        signatureData: undefined, // liberar base64 de memoria
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
    const optimistic: ConsentTemplate = {
      id: `temp-${Date.now()}`,
      name: data.name,
      category: data.category,
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
        category: data.category,
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
