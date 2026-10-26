/** Categorías permitidas (alineadas con el CHECK de consent_templates en Supabase). */
export const TEMPLATE_CATEGORIES = [
  'Tratamiento estético facial',
  'Cirugía ambulatoria',
  'Dermatología clínica',
  'Medicina estética corporal',
  'Odontología / Cirugía oral',
  'Medicina general',
  'Neuromoduladores',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
