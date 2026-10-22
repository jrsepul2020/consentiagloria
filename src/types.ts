// ── Document Status ───────────────────────────────────────────────────────────
export type DocumentStatus = 'FIRMADO' | 'PENDIENTE' | 'BORRADOR' | 'RECHAZADO';

// ── Patient ───────────────────────────────────────────────────────────────────
// Matches Supabase table: patients (id, full_name, dni, phone, email, created_at, updated_at)
export interface Patient {
  id: string;
  fullName: string;
  dni: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ── Consent ───────────────────────────────────────────────────────────────────
// Matches Supabase table: consents
export interface Consent {
  id: string;
  patientId: string;
  templateId: string;
  patientNameSnapshot: string;   // snapshot of patient name at consent creation
  patientDniSnapshot: string;    // snapshot of patient DNI at consent creation
  title: string;
  category: string;
  templateVersion: number;
  contentSnapshot: string;       // snapshot of template content at consent creation
  status: DocumentStatus;
  /** @deprecated Prefer signaturePath — solo en memoria al firmar / legacy */
  signatureData?: string;
  /** Ruta en bucket consent-signatures (PNG), no base64 en BD */
  signaturePath?: string;
  signedAt?: string;
  pdfPath?: string;              // path in consent-pdfs Storage bucket
  createdAt: string;
  updatedAt: string;
}

// ── ConsentTemplate ───────────────────────────────────────────────────────────
// Matches Supabase table: consent_templates
export interface ConsentTemplate {
  id: string;
  name: string;       // display name of the template
  category: string;
  content: string;    // full legal text of the consent
  version: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── ClinicSettings ────────────────────────────────────────────────────────────
// Matches Supabase table: clinic_settings (single row, id=1)
export interface ClinicSettings {
  id: number;
  clinicName: string;
  professionalName: string;
  professionalTitle: string;
  medicalLicense: string;
  email: string;
  phone: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── PushNotification ──────────────────────────────────────────────────────────
// In-memory only — no Supabase table. Lives only for the current session.
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'signature' | 'new_client' | 'system';
  relatedId?: string;
}

// ── ActivityLog ───────────────────────────────────────────────────────────────
// Matches Supabase table: activity_logs
export interface ActivityLog {
  id: string;
  consentId?: string;
  patientId?: string;
  action: string;    // descriptive action string
  createdAt: string;
}
