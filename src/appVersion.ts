/**
 * Control de versión de Consentia.
 * Actualizar estos dos valores en cada release / despliegue.
 */
export const APP_VERSION = '1.2.0';
/** Fecha de la última actualización (YYYY-MM-DD) */
export const APP_UPDATED_AT = '2026-10-26';

export function formatAppUpdatedAt(locale = 'es-ES'): string {
  const [y, m, d] = APP_UPDATED_AT.split('-').map(Number);
  if (!y || !m || !d) return APP_UPDATED_AT;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getAppVersionLabel(): string {
  return `v${APP_VERSION} · ${formatAppUpdatedAt()}`;
}
