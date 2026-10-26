/** Detecta consentimientos de neuromoduladores (toxina / botox). */
export function isNeuromodulatorConsent(input: {
  title?: string;
  category?: string;
  name?: string;
}): boolean {
  const s = `${input.title || ''} ${input.category || ''} ${input.name || ''}`.toLowerCase();
  return /neuromodul|toxina|botul[ií]n|botox/.test(s);
}

/** Asegura una categoría válida para el CHECK de Supabase. */
export function normalizeTemplateCategory(category: string): string {
  const allowed = [
    'Tratamiento estético facial',
    'Cirugía ambulatoria',
    'Dermatología clínica',
    'Medicina estética corporal',
    'Odontología / Cirugía oral',
    'Medicina general',
    'Neuromoduladores',
  ];
  if (allowed.includes(category)) return category;
  if (/neuromodul|toxina|botox/i.test(category)) return 'Neuromoduladores';
  if (/cirug/i.test(category)) return 'Cirugía ambulatoria';
  if (/corporal/i.test(category)) return 'Medicina estética corporal';
  if (/derma/i.test(category)) return 'Dermatología clínica';
  if (/odonto|oral/i.test(category)) return 'Odontología / Cirugía oral';
  return 'Tratamiento estético facial';
}
