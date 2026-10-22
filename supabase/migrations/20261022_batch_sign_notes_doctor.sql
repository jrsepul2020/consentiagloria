-- Consentia · Firma en lote, notas de paciente, firma doctora, neuromoduladores
-- Ejecutar en el SQL Editor de Supabase tras la migración RLS previa.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Neuromoduladores: nº de administración + fecha por consentimiento
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.consents
  ADD COLUMN IF NOT EXISTS administration_number text,
  ADD COLUMN IF NOT EXISTS administration_date date;

COMMENT ON COLUMN public.consents.administration_number IS
  'Nº de administración / lote (neuromoduladores).';
COMMENT ON COLUMN public.consents.administration_date IS
  'Fecha de administración del producto (neuromoduladores).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Firma de la profesional en ajustes de clínica
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS doctor_signature_path text;

COMMENT ON COLUMN public.clinic_settings.doctor_signature_path IS
  'Ruta PNG en bucket clinic-assets (firma de la doctora).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) Notas clínicas acumulables por paciente
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_date
  ON public.patient_notes (patient_id, note_date DESC);

ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_notes_select_auth" ON public.patient_notes;
DROP POLICY IF EXISTS "patient_notes_insert_auth" ON public.patient_notes;
DROP POLICY IF EXISTS "patient_notes_update_auth" ON public.patient_notes;
DROP POLICY IF EXISTS "patient_notes_delete_auth" ON public.patient_notes;

CREATE POLICY "patient_notes_select_auth" ON public.patient_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "patient_notes_insert_auth" ON public.patient_notes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patient_notes_update_auth" ON public.patient_notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "patient_notes_delete_auth" ON public.patient_notes
  FOR DELETE TO authenticated USING (true);

REVOKE ALL ON public.patient_notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_notes TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Bucket firma doctora / assets de clínica
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('clinic-assets', 'clinic-assets', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "auth_read_clinic_assets" ON storage.objects;
DROP POLICY IF EXISTS "auth_write_clinic_assets" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_clinic_assets" ON storage.objects;

CREATE POLICY "auth_read_clinic_assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'clinic-assets');

CREATE POLICY "auth_write_clinic_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinic-assets');

CREATE POLICY "auth_update_clinic_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'clinic-assets');
