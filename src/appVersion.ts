/**
 * Control de versión de Consentia.
 * Actualizar APP_VERSION y APP_UPDATED_AT en cada release / despliegue.
 * APP_UPDATED_AT: ISO local `YYYY-MM-DDTHH:mm` (incluye hora para verificar el deploy).
 */
export const APP_VERSION = '1.2.2';
/** Fecha y hora de la última actualización (YYYY-MM-DDTHH:mm) */
export const APP_UPDATED_AT = '2026-10-26T12:49';

export function formatAppUpdatedAt(locale = 'es-ES'): string {
  const raw = APP_UPDATED_AT.trim();
  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) return APP_UPDATED_AT;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = m[4] != null ? Number(m[4]) : 0;
  const minute = m[5] != null ? Number(m[5]) : 0;
  const second = m[6] != null ? Number(m[6]) : 0;
  const date = new Date(year, month - 1, day, hour, minute, second);

  const hasTime = m[4] != null;
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(hasTime
      ? { hour: '2-digit', minute: '2-digit', hour12: false }
      : {}),
  });
}

export function getAppVersionLabel(): string {
  return `v${APP_VERSION} · ${formatAppUpdatedAt()}`;
}
