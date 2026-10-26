import React, { useEffect, useMemo, useState } from 'react';
import { Check, LayoutTemplate, Tag, Info } from 'lucide-react';
import { ConsentTemplate } from '../../types';
import { TEMPLATE_CATEGORIES } from '../../constants/templateCategories';
import { RichTextEditor } from '../RichTextEditor';
import { normalizeHtml, plainTextToHtml } from '../../utils/htmlContent';
import { normalizeTemplateCategory } from '../../utils/consentHelpers';

interface TemplateEditorViewProps {
  templateToEdit?: ConsentTemplate | null;
  onCancel: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    category: string;
    content: string;
    version: number;
  }) => void;
}

const CATEGORIES: string[] = [...TEMPLATE_CATEGORIES];

export const TemplateEditorView: React.FC<TemplateEditorViewProps> = ({
  templateToEdit,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('<p></p>');
  const [originalContent, setOriginalContent] = useState('<p></p>');
  const [originalVersion, setOriginalVersion] = useState(1);

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setCategory(
        CATEGORIES.includes(templateToEdit.category)
          ? templateToEdit.category
          : normalizeTemplateCategory(templateToEdit.category)
      );
      const html = plainTextToHtml(templateToEdit.content || '');
      setContent(html);
      setOriginalContent(html);
      setOriginalVersion(templateToEdit.version || 1);
    } else {
      setName('');
      setCategory(CATEGORIES[0]);
      setContent('<p></p>');
      setOriginalContent('<p></p>');
      setOriginalVersion(1);
    }
  }, [templateToEdit]);

  const contentChanged = useMemo(
    () => normalizeHtml(content) !== normalizeHtml(originalContent),
    [content, originalContent]
  );

  const nextVersion = templateToEdit
    ? contentChanged
      ? originalVersion + 1
      : originalVersion
    : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plainEnough = content.replace(/<[^>]+>/g, '').trim();
    if (!name.trim() || !plainEnough) return;
    onSave({
      id: templateToEdit?.id,
      name: name.trim(),
      category: normalizeTemplateCategory(category),
      content,
      version: nextVersion,
    });
  };

  const fieldClass =
    'w-full text-base p-4 rounded-2xl border border-slate-200/90 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium';

  return (
    <div className="max-w-3xl mx-auto pb-36 lg:pb-10 -mx-3 sm:-mx-2 lg:mx-auto">
      <div className="rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-3 sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 rounded-2xl text-[#bd003c] dark:text-rose-400 shrink-0">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {templateToEdit ? 'Editar plantilla' : 'Nueva plantilla'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Texto legal completo · pantalla amplia para documentos largos
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Toxina Botulínica Tipo A"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <Info className="w-4 h-4 text-[#373DA2] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                La <strong>versión sube sola</strong> solo si cambias el texto legal (v
                {originalVersion}
                {contentChanged ? ` → v${nextVersion}` : ''}). Si solo tocas nombre o categoría, se
                mantiene. Los consentimientos ya generados/firmados <strong>no cambian</strong>:
                guardan su propia copia del texto.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#bd003c] text-white text-xs font-extrabold shrink-0">
              v{nextVersion}
              {contentChanged && templateToEdit ? ' (nuevo)' : ''}
            </span>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Texto legal *
            </label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="fixed bottom-0 inset-x-0 lg:static lg:pt-2 z-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 lg:border-0 lg:bg-transparent p-4 lg:p-0 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[1.5] py-3.5 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] text-white font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {templateToEdit
                ? contentChanged
                  ? `Guardar como v${nextVersion}`
                  : 'Guardar cambios'
                : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
