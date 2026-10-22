/** Nombre = primera palabra; apellidos = resto. */
export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Formato lista: "Apellidos, Nombre". */
export function displayNameBySurname(fullName: string) {
  const { firstName, lastName } = splitFullName(fullName);
  if (!lastName || lastName === firstName) return firstName;
  return `${lastName}, ${firstName}`;
}

export function compareBySurnameThenName(a: string, b: string) {
  const pa = splitFullName(a);
  const pb = splitFullName(b);
  const byLast = pa.lastName.localeCompare(pb.lastName, 'es', { sensitivity: 'base' });
  if (byLast !== 0) return byLast;
  return pa.firstName.localeCompare(pb.firstName, 'es', { sensitivity: 'base' });
}

/** Iniciales para avatar (máx. 2). */
export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} d`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatLongDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
