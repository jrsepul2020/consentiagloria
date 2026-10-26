import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL o clave anon no configuradas. Comprueba VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Envía email de recuperación de contraseña (Supabase Auth). */
export async function resetPasswordForEmail(email: string) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/** Cambia la contraseña del usuario actualmente autenticado. */
export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

const REMEMBER_EMAIL_KEY = 'consentia_remember_email';

export function getRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setRememberedEmail(email: string | null) {
  try {
    if (email && email.trim()) localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    else localStorage.removeItem(REMEMBER_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}
