-- Consentia · Alinear CHECK de status con la app (PENDIENTE / FIRMADO / …)
-- Ejecutar en SQL Editor de Supabase si el alta falla con consents_status_check.

ALTER TABLE public.consents
  DROP CONSTRAINT IF EXISTS consents_status_check;

ALTER TABLE public.consents
  ADD CONSTRAINT consents_status_check
  CHECK (
    status IS NULL OR status IN (
      'PENDIENTE',
      'FIRMADO',
      'BORRADOR',
      'RECHAZADO',
      -- compatibilidad con posibles valores antiguos
      'pendiente',
      'firmado',
      'borrador',
      'rechazado',
      'pending',
      'signed',
      'draft',
      'rejected',
      'PENDING',
      'SIGNED',
      'DRAFT',
      'REJECTED'
    )
  );

-- Unificar filas antiguas a los valores canónicos de la app
UPDATE public.consents
SET status = 'PENDIENTE'
WHERE lower(status) IN ('pending', 'pendiente');

UPDATE public.consents
SET status = 'FIRMADO'
WHERE lower(status) IN ('signed', 'firmado', 'completed', 'complete');

UPDATE public.consents
SET status = 'BORRADOR'
WHERE lower(status) IN ('draft', 'borrador');

UPDATE public.consents
SET status = 'RECHAZADO'
WHERE lower(status) IN ('rejected', 'rechazado');
