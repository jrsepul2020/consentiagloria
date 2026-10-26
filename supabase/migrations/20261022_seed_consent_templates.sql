-- Consentia · Categorías permitidas + plantillas de ejemplo
-- Ejecutar en el SQL Editor de Supabase.

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consent_templates TO authenticated;

ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select_auth" ON public.consent_templates;
DROP POLICY IF EXISTS "templates_write_auth" ON public.consent_templates;
DROP POLICY IF EXISTS "templates_insert_auth" ON public.consent_templates;
DROP POLICY IF EXISTS "templates_update_auth" ON public.consent_templates;
DROP POLICY IF EXISTS "templates_delete_auth" ON public.consent_templates;

CREATE POLICY "templates_select_auth" ON public.consent_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_insert_auth" ON public.consent_templates
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "templates_update_auth" ON public.consent_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "templates_delete_auth" ON public.consent_templates
  FOR DELETE TO authenticated USING (true);

-- Sustituir el CHECK antiguo (rechazaba las categorías de la app)
ALTER TABLE public.consent_templates
  DROP CONSTRAINT IF EXISTS consent_templates_category_check;

ALTER TABLE public.consent_templates
  ADD CONSTRAINT consent_templates_category_check
  CHECK (category IN (
    'Tratamiento estético facial',
    'Cirugía ambulatoria',
    'Dermatología clínica',
    'Medicina estética corporal',
    'Odontología / Cirugía oral',
    'Medicina general',
    'Neuromoduladores'
  ));

-- Solo si la tabla está vacía
INSERT INTO public.consent_templates (name, category, content, version, active)
SELECT v.name, v.category, v.content, v.version, v.active
FROM (
  VALUES
    (
      'Tratamiento Estético Facial Completo',
      'Tratamiento estético facial',
      'Yo, [Nombre del Paciente], declaro haber sido debidamente informado/a por la Dra. Gloria Cabezas sobre el procedimiento de tratamiento estético facial (rellenos de ácido hialurónico, hilos tensores y revitalización cutánea). Comprendo que los resultados dependen de la respuesta tisular individual. He sido informado de los cuidados posteriores necesarios y acepto voluntariamente la realización del tratamiento.',
      1,
      true
    ),
    (
      'Cirugía Menor Ambulatoria',
      'Cirugía ambulatoria',
      'Autorizo la realización de procedimiento de cirugía menor ambulatoria bajo anestesia local en instalaciones esterilizadas homologadas. Se me han explicado los objetivos, riesgos habituales (molestias locales, cicatrización) y alternativas de tratamiento.',
      1,
      true
    ),
    (
      'Toxina Botulínica Tipo A (Dermoestética)',
      'Tratamiento estético facial',
      'Consiento la aplicación dermoestética de toxina botulínica / neuromoduladores purificada en el tercio superior facial para la atenuación de líneas de expresión dinámicas. He recibido instrucciones completas sobre mantener posición erguida durante las 4 horas posteriores a la aplicación.',
      1,
      true
    ),
    (
      'Peeling Químico & Revitalización',
      'Tratamiento estético facial',
      'Acepto la aplicación de ácidos médicos para renovación epidérmica y exfoliación cutánea. Entiendo el compromiso de utilizar fotoprotección solar estricta SPF50+ durante todo el periodo de recuperación.',
      1,
      true
    ),
    (
      'Neuromoduladores',
      'Neuromoduladores',
      'Consiento la administración de neuromoduladores según el protocolo informado por la Dra. Gloria Cabezas. Comprendo indicaciones, riesgos, cuidados posteriores y la necesidad de registrar el número de administración y la fecha del producto utilizado.',
      1,
      true
    )
) AS v(name, category, content, version, active)
WHERE NOT EXISTS (SELECT 1 FROM public.consent_templates LIMIT 1);
