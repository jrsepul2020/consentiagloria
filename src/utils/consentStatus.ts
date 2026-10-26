import { DocumentStatus } from '../types';

/** Valores de status que usa la UI. */
export const APP_STATUS = {
  pending: 'PENDIENTE',
  signed: 'FIRMADO',
  draft: 'BORRADOR',
  rejected: 'RECHAZADO',
} as const satisfies Record<string, DocumentStatus>;

/**
 * Candidatos a escribir en BD (por si el CHECK antiguo usa inglés o minúsculas).
 * El primero es el canónico de la app.
 */
export const STATUS_DB_CANDIDATES: Record<DocumentStatus, string[]> = {
  PENDIENTE: ['PENDIENTE', 'pendiente', 'pending', 'PENDING', 'Pending'],
  FIRMADO: ['FIRMADO', 'firmado', 'signed', 'SIGNED', 'Signed', 'completed', 'COMPLETED'],
  BORRADOR: ['BORRADOR', 'borrador', 'draft', 'DRAFT', 'Draft'],
  RECHAZADO: ['RECHAZADO', 'rechazado', 'rejected', 'REJECTED', 'Rejected'],
};

/** Normaliza lo que venga de BD a los valores de la UI. */
export function normalizeConsentStatus(raw: unknown): DocumentStatus {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!s) return 'PENDIENTE';
  if (['pendiente', 'pending'].includes(s)) return 'PENDIENTE';
  if (['firmado', 'signed', 'completed', 'complete'].includes(s)) return 'FIRMADO';
  if (['borrador', 'draft'].includes(s)) return 'BORRADOR';
  if (['rechazado', 'rejected'].includes(s)) return 'RECHAZADO';
  const upper = String(raw).trim().toUpperCase() as DocumentStatus;
  if (upper in STATUS_DB_CANDIDATES) return upper;
  return 'PENDIENTE';
}

/** Filtro PostgREST `.in('status', …)` para un estado de la UI. */
export function statusValuesForFilter(appStatus: DocumentStatus): string[] {
  return STATUS_DB_CANDIDATES[appStatus];
}
