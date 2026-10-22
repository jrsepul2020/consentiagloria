-- Consentia · Seguridad RLS + firmas en Storage
-- Ejecutar en el SQL Editor de Supabase (proyecto de la clínica).
-- Revisar y adaptar si ya tenéis políticas con otros nombres.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Columna para ruta de firma (sin base64 en la tabla)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.consents
  ADD COLUMN IF NOT EXISTS signature_path text;

COMMENT ON COLUMN public.consents.signature_path IS
  'Ruta del PNG en bucket consent-signatures. No usar signature_data para nuevas firmas.';

-- Opcional: limpiar firmas legacy enormes (descomentar cuando Storage esté OK)
-- UPDATE public.consents SET signature_data = NULL WHERE signature_path IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Índices para búsqueda / paginación
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_dni ON public.patients (dni);
CREATE INDEX IF NOT EXISTS idx_consents_created_at ON public.consents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_status ON public.consents (status);
CREATE INDEX IF NOT EXISTS idx_consents_patient_name ON public.consents (patient_name_snapshot);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) RLS: solo usuarios autenticados (staff de la clínica)
--    Modelo actual: una sola clínica / un equipo con login.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- patients
DROP POLICY IF EXISTS "patients_select_auth" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_auth" ON public.patients;
DROP POLICY IF EXISTS "patients_update_auth" ON public.patients;
DROP POLICY IF EXISTS "patients_delete_auth" ON public.patients;

CREATE POLICY "patients_select_auth" ON public.patients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients_insert_auth" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patients_update_auth" ON public.patients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "patients_delete_auth" ON public.patients
  FOR DELETE TO authenticated USING (true);

-- consents
DROP POLICY IF EXISTS "consents_select_auth" ON public.consents;
DROP POLICY IF EXISTS "consents_insert_auth" ON public.consents;
DROP POLICY IF EXISTS "consents_update_auth" ON public.consents;
DROP POLICY IF EXISTS "consents_delete_auth" ON public.consents;

CREATE POLICY "consents_select_auth" ON public.consents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "consents_insert_auth" ON public.consents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "consents_update_auth" ON public.consents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "consents_delete_auth" ON public.consents
  FOR DELETE TO authenticated USING (true);

-- consent_templates
DROP POLICY IF EXISTS "templates_select_auth" ON public.consent_templates;
DROP POLICY IF EXISTS "templates_write_auth" ON public.consent_templates;

CREATE POLICY "templates_select_auth" ON public.consent_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_write_auth" ON public.consent_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- clinic_settings (solo lectura/edición autenticada; una fila)
DROP POLICY IF EXISTS "clinic_settings_auth" ON public.clinic_settings;
CREATE POLICY "clinic_settings_auth" ON public.clinic_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_auth" ON public.activity_logs;
CREATE POLICY "activity_logs_auth" ON public.activity_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bloquear anon explícitamente (por si hubiera políticas abiertas previas)
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.consents FROM anon;
REVOKE ALL ON public.consent_templates FROM anon;
REVOKE ALL ON public.clinic_settings FROM anon;
REVOKE ALL ON public.activity_logs FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consent_templates TO authenticated;
GRANT SELECT, UPDATE ON public.clinic_settings TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Storage buckets (crear en Dashboard si no existen) + políticas
--    Buckets privados: consent-pdfs, consent-signatures
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('consent-pdfs', 'consent-pdfs', false, 20971520, ARRAY['application/pdf']),
  ('consent-signatures', 'consent-signatures', false, 2097152, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "auth_read_consent_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "auth_write_consent_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_consent_signatures" ON storage.objects;
DROP POLICY IF EXISTS "auth_write_consent_signatures" ON storage.objects;

CREATE POLICY "auth_read_consent_pdfs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'consent-pdfs');

CREATE POLICY "auth_write_consent_pdfs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consent-pdfs');

CREATE POLICY "auth_update_consent_pdfs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'consent-pdfs');

CREATE POLICY "auth_read_consent_signatures" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'consent-signatures');

CREATE POLICY "auth_write_consent_signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'consent-signatures');

CREATE POLICY "auth_update_consent_signatures" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'consent-signatures');
