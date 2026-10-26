const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'H1',
  'H2',
  'H3',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'UL',
  'OL',
  'LI',
  'DIV',
]);

/** True si el contenido parece HTML de plantilla. */
export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** Normaliza HTML para comparar si el texto legal cambió. */
export function normalizeHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim()
    .toLowerCase();
}

/** Limpia HTML pegado (Word, etc.) dejando solo formato legal básico. */
export function sanitizeHtml(dirty: string): string {
  if (typeof document === 'undefined') {
    return dirty.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
  const template = document.createElement('template');
  template.innerHTML = dirty;

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          // Sustituir por su contenido
          while (el.firstChild) node.insertBefore(el.firstChild, el);
          node.removeChild(el);
          continue;
        }
        // Quitar atributos (estilo Word, clases, etc.)
        while (el.attributes.length > 0) {
          el.removeAttribute(el.attributes[0].name);
        }
        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/** Convierte HTML a texto plano con saltos de línea (para PDF / búsqueda). */
export function htmlToPlainText(html: string): string {
  if (!looksLikeHtml(html)) return html;
  if (typeof document === 'undefined') {
    return html
      .replace(/<\/(p|h1|h2|h3|li|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  const div = document.createElement('div');
  div.innerHTML = sanitizeHtml(html);
  // Asegurar saltos visibles
  div.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  div.querySelectorAll('p,h1,h2,h3,li,div').forEach((el) => {
    el.appendChild(document.createTextNode('\n'));
  });
  return (div.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Envuelve texto plano en párrafos HTML. */
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return '<p></p>';
  if (looksLikeHtml(text)) return sanitizeHtml(text);
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
