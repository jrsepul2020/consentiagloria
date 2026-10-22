import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronRight, FileText, LayoutTemplate } from 'lucide-react';
import { ConsentTemplate } from '../../types';

interface TemplatesViewProps {
  templates: ConsentTemplate[];
  onNewTemplate: () => void;
  onEditTemplate: (template: ConsentTemplate) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onUseTemplate: (template: ConsentTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onNewTemplate,
  onEditTemplate,
  onUseTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates
      .filter((t) => {
        const matchesCat = categoryFilter === 'Todos' || t.category === categoryFilter;
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          t.name.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term);
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [templates, categoryFilter, searchTerm]);

  return (
    <div className="space-y-4 pb-28 lg:pb-6 max-w-5xl relative">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Plantillas</h2>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar plantilla..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
              categoryFilter === cat
                ? 'bg-[#373DA2] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <LayoutTemplate className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">No hay plantillas</p>
          </div>
        ) : (
          filtered.map((tmpl) => (
            <button
              type="button"
              key={tmpl.id}
              onClick={() => onEditTemplate(tmpl)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#bd003c] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {tmpl.name}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  v{tmpl.version}
                  {tmpl.active ? ' · ACTIVA' : ' · INACTIVA'} · {tmpl.category}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseTemplate(tmpl);
                }}
                className="text-[10px] font-extrabold text-[#373DA2] dark:text-blue-300 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0"
              >
                Usar
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={onNewTemplate}
        className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-20 w-14 h-14 rounded-full bg-[#bd003c] text-white shadow-lg flex items-center justify-center"
        aria-label="Nueva plantilla"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
