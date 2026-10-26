-- Consentia · Permitir generar consentimiento aunque falle el FK de plantilla
-- Ejecutar en SQL Editor de Supabase si el alta falla por template_id.

-- template_id opcional (el contenido ya va en content_snapshot)
ALTER TABLE public.consents
  ALTER COLUMN template_id DROP NOT NULL;

-- Alinear CHECK de categoría en consents (si existe) con las plantillas
ALTER TABLE public.consents
  DROP CONSTRAINT IF EXISTS consents_category_check;

ALTER TABLE public.consents
  ADD CONSTRAINT consents_category_check
  CHECK (
    category IS NULL OR category IN (
      'Tratamiento estético facial',
      'Cirugía ambulatoria',
      'Dermatología clínica',
      'Medicina estética corporal',
      'Odontología / Cirugía oral',
      'Medicina general',
      'Neuromoduladores'
    )
  );
