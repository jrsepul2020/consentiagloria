/** Detecta consentimientos de neuromoduladores (toxina / botox). */
export function isNeuromodulatorConsent(input: {
  title?: string;
  category?: string;
  name?: string;
}): boolean {
  const s = `${input.title || ''} ${input.category || ''} ${input.name || ''}`.toLowerCase();
  return /neuromodul|toxina|botul[ií]n|botox/.test(s);
}
