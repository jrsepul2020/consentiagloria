import React, { useState } from 'react';
import { Search, LayoutTemplate, Plus, Edit2, ToggleLeft, ToggleRight, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
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
  onToggleActive,
  onUseTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'TODAS' | 'ACTIVAS' | 'INACTIVAS'>('ACTIVAS');
  const [previewTemplate, setPreviewTemplate] = useState<ConsentTemplate | null>(null);

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch =
      tmpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterState === 'TODAS' ||
      (filterState === 'ACTIVAS' && tmpl.active) ||
      (filterState === 'INACTIVAS' && !tmpl.active);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in max-w-5xl">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Plantillas de Consentimiento
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Modelos reutilizables en <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">consent_templates</code>
          </p>
        </div>

        <button
          onClick={onNewTemplate}
          className="py-2.5 px-4 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre de plantilla o categoría..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden shadow-2xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {(['ACTIVAS', 'INACTIVAS', 'TODAS'] as const).map((state) => (
          <button
            key={state}
            onClick={() => setFilterState(state)}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
              filterState === state
                ? 'bg-white dark:bg-slate-700 text-[#bd003c] dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {state}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
            <LayoutTemplate className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">No se encontraron plantillas</p>
            <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros de búsqueda</p>
            <button
              onClick={onNewTemplate}
              className="mt-3 px-4 py-2 bg-[#bd003c] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Crear primera plantilla
            </button>
          </div>
        ) : (
          filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                tmpl.active
                  ? 'border-slate-200/80 dark:border-slate-700/80'
                  : 'border-slate-200/40 dark:border-slate-800 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {tmpl.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-[#bd003c] dark:text-rose-400 text-[10px] font-extrabold rounded-md">
                        v{tmpl.version}
                      </span>
                    </div>
                    <p className="text-xs text-[#bd003c] dark:text-rose-400 font-semibold mt-0.5">
                      {tmpl.category}
                    </p>
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={() => onToggleActive(tmpl.id, tmpl.active)}
                    title={tmpl.active ? 'Desactivar plantilla' : 'Activar plantilla'}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                      tmpl.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tmpl.active ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" /> Activa
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" /> Inactiva
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {tmpl.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Ver Texto
                  </button>
                  <button
                    onClick={() => onEditTemplate(tmpl)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Editar
                  </button>
                </div>

                <button
                  onClick={() => onUseTemplate(tmpl)}
                  className="py-2 px-3.5 bg-[#373DA2] hover:bg-[#2b3085] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Usar Plantilla
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Full Text Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#bd003c] dark:text-rose-400">
                    {previewTemplate.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-100 text-[#bd003c] text-[10px] font-extrabold rounded-md">
                    v{previewTemplate.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Categoría: {previewTemplate.category}</p>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap max-h-96 overflow-y-auto">
              {previewTemplate.content}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-200"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  onUseTemplate(tmpl);
                }}
                className="flex-1 py-3 bg-[#373DA2] hover:bg-[#2b3085] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Usar en Consentimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
