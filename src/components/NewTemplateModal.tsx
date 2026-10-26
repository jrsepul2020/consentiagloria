import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutTemplate, Check, FileText, Tag, Sparkles } from 'lucide-react';
import { ConsentTemplate } from '../types';
import { TEMPLATE_CATEGORIES } from '../constants/templateCategories';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: ConsentTemplate | null;
  onSaveTemplate: (data: {
    id?: string;
    name: string;
    category: string;
    content: string;
    version: number;
  }) => void;
}

const COMMON_CATEGORIES: string[] = [...TEMPLATE_CATEGORIES];

export const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaveTemplate,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        setName(templateToEdit.name);
        if (COMMON_CATEGORIES.includes(templateToEdit.category)) {
          setCategory(templateToEdit.category);
          setUseCustomCategory(false);
        } else {
          setCustomCategory(templateToEdit.category);
          setUseCustomCategory(true);
        }
        setContent(templateToEdit.content);
        setVersion(templateToEdit.version + 1); // increment version on edit
      } else {
        setName('');
        setCategory(COMMON_CATEGORIES[0]);
        setCustomCategory('');
        setUseCustomCategory(false);
        setContent('');
        setVersion(1);
      }
    }
  }, [isOpen, templateToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = useCustomCategory && customCategory.trim() ? customCategory.trim() : category;
    if (!name.trim() || !content.trim() || !finalCategory) return;

    onSaveTemplate({
      id: templateToEdit?.id,
      name,
      category: finalCategory,
      content,
      version,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/70 z-50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl z-50 shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 rounded-2xl text-[#bd003c] dark:text-rose-400">
                  <LayoutTemplate className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {templateToEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {templateToEdit ? `Actualizando v${templateToEdit.version} → v${version}` : 'Modelo reusable de consentimiento'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Template Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Toxina Botulínica Tipo A (Dermoestética)"
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    Categoría / Especialidad *
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCategory(!useCustomCategory)}
                    className="text-[11px] font-bold text-[#bd003c] hover:underline"
                  >
                    {useCustomCategory ? 'Elegir de lista' : '+ Nueva categoría'}
                  </button>
                </div>

                {!useCustomCategory ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium"
                  >
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ej. Medicina Capilar, Podología..."
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium"
                  />
                )}
              </div>

              {/* Version Badge */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Versión del Documento:
                </span>
                <span className="px-2.5 py-0.5 bg-[#bd003c] text-white rounded-full text-xs font-extrabold">
                  v{version}
                </span>
              </div>

              {/* Legal Content Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Texto Legal Completo del Consentimiento *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Yo, [Nombre del Paciente], reconozco haber recibido explicación detallada sobre el procedimiento..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden font-medium leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Check className="w-5 h-5" />
                  {templateToEdit ? 'Guardar Cambios' : 'Crear y Publicar Plantilla'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
