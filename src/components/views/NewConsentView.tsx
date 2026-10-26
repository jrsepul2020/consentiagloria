import React, { useState, useEffect, useMemo } from 'react';
import { Search, Check, UserPlus, ChevronRight } from 'lucide-react';
import { Patient, ConsentTemplate } from '../../types';
import { AvatarInitials } from '../AvatarInitials';
import {
  compareBySurnameThenName,
  displayNameBySurname,
} from '../../utils/nameFormat';
import { supabaseService } from '../../services/supabaseService';
import { htmlToPlainText, looksLikeHtml, sanitizeHtml } from '../../utils/htmlContent';

interface NewConsentViewProps {
  patients: Patient[];
  templates: ConsentTemplate[];
  preselectedPatientId?: string;
  preselectedTemplateId?: string;
  onCancel: () => void;
  onRequestNewClient?: (draftName?: string) => void;
  onCreateConsent: (data: {
    patientId: string;
    patientNameSnapshot: string;
    patientDniSnapshot: string;
    templateId: string;
    title: string;
    category: string;
    templateVersion: number;
    contentSnapshot: string;
  }) => void | Promise<void>;
}

type Step = 1 | 2 | 3;

export const NewConsentView: React.FC<NewConsentViewProps> = ({
  patients,
  templates,
  preselectedPatientId,
  preselectedTemplateId,
  onCancel,
  onRequestNewClient,
  onCreateConsent,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [seedingTemplates, setSeedingTemplates] = useState(false);

  const isPersistedId = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  const sortedPatients = useMemo(
    () =>
      [...patients]
        .filter((p) => isPersistedId(p.id))
        .sort((a, b) => compareBySurnameThenName(a.fullName, b.fullName)),
    [patients]
  );

  const latestActiveTemplates = useMemo(() => {
    // active !== false: plantillas sin columna active o con null siguen visibles
    const active = templates.filter((t) => t.active !== false && isPersistedId(t.id));
    const mapByName = new Map<string, ConsentTemplate>();
    active.forEach((tmpl) => {
      const key = tmpl.name.trim().toLowerCase();
      const existing = mapByName.get(key);
      if (!existing || tmpl.version > existing.version) mapByName.set(key, tmpl);
    });
    return Array.from(mapByName.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [templates]);

  // Al llegar al paso tratamiento, intentar cargar/sembrar plantillas automáticamente
  useEffect(() => {
    if (step !== 2) return;
    if (latestActiveTemplates.length > 0) return;
    let cancelled = false;
    setSeedingTemplates(true);
    void supabaseService
      .ensureDefaultTemplates()
      .finally(() => {
        if (!cancelled) setSeedingTemplates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, latestActiveTemplates.length]);

  const categories = useMemo(() => {
    const set = new Set(latestActiveTemplates.map((t) => t.category).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [latestActiveTemplates]);

  const selectedPatient = sortedPatients.find((p) => p.id === selectedPatientId) || null;
  const selectedTemplate =
    latestActiveTemplates.find((t) => t.id === selectedTemplateId) || null;

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return sortedPatients;
    const term = patientSearch.toLowerCase().trim();
    return sortedPatients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        displayNameBySurname(p.fullName).toLowerCase().includes(term) ||
        p.dni.toLowerCase().includes(term)
    );
  }, [sortedPatients, patientSearch]);

  const filteredTemplates = useMemo(() => {
    return latestActiveTemplates.filter((t) => {
      const matchesCat = categoryFilter === 'Todos' || t.category === categoryFilter;
      if (!templateSearch.trim()) return matchesCat;
      const term = templateSearch.toLowerCase().trim();
      return (
        matchesCat &&
        (t.name.toLowerCase().includes(term) || t.category.toLowerCase().includes(term))
      );
    });
  }, [latestActiveTemplates, categoryFilter, templateSearch]);

  useEffect(() => {
    if (preselectedPatientId && sortedPatients.some((p) => p.id === preselectedPatientId)) {
      setSelectedPatientId(preselectedPatientId);
    }
    if (preselectedTemplateId && latestActiveTemplates.some((t) => t.id === preselectedTemplateId)) {
      setSelectedTemplateId(preselectedTemplateId);
    }
  }, [preselectedPatientId, preselectedTemplateId, sortedPatients, latestActiveTemplates]);

  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(() => {
      void supabaseService.searchPatients(patientSearch);
    }, 280);
    return () => clearTimeout(t);
  }, [patientSearch, step]);

  useEffect(() => {
    if (selectedTemplate && !documentTitle) {
      setDocumentTitle(selectedTemplate.name);
    }
  }, [selectedTemplate, documentTitle]);

  const canNext =
    !saving &&
    ((step === 1 && !!selectedPatient && !selectedPatient.id.startsWith('temp-')) ||
      (step === 2 && !!selectedTemplate) ||
      step === 3);

  const goNext = async () => {
    if (step === 1 && selectedPatient) {
      if (selectedPatient.id.startsWith('temp-')) return;
      setStep(2);
    } else if (step === 2 && selectedTemplate) {
      setDocumentTitle(selectedTemplate.name);
      setStep(3);
    } else if (step === 3 && selectedPatient && selectedTemplate) {
      if (selectedPatient.id.startsWith('temp-')) return;
      setSaving(true);
      try {
        // Releer plantillas por si el ID local no existe ya en BD
        const fresh = await supabaseService.ensureDefaultTemplates();
        const tmpl =
          fresh.find((t) => t.id === selectedTemplate.id) ||
          fresh.find(
            (t) =>
              t.name.trim().toLowerCase() === selectedTemplate.name.trim().toLowerCase()
          ) ||
          selectedTemplate;
        await onCreateConsent({
          patientId: selectedPatient.id,
          patientNameSnapshot: selectedPatient.fullName,
          patientDniSnapshot: selectedPatient.dni,
          templateId: tmpl.id,
          title: documentTitle.trim() || tmpl.name,
          category: tmpl.category || selectedTemplate.category,
          templateVersion: tmpl.version || selectedTemplate.version,
          contentSnapshot: tmpl.content || selectedTemplate.content,
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const steps = [
    { n: 1 as Step, label: 'Cliente' },
    { n: 2 as Step, label: 'Tratamiento' },
    { n: 3 as Step, label: 'Revisar' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-36 lg:pb-10 -mx-3 sm:-mx-2 lg:mx-auto">
      <div className="rounded-2xl sm:rounded-3xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-3 sm:p-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">
          Nuevo consentimiento
        </h2>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-5">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                type="button"
                onClick={() => {
                  if (s.n < step) setStep(s.n);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold ${
                  step === s.n
                    ? 'bg-[#bd003c] text-white'
                    : step > s.n
                      ? 'bg-[#373DA2] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {step > s.n ? <Check className="w-3 h-3" /> : s.n}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-[#373DA2]' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Paso 1: Cliente */}
        {step === 1 && (
          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 space-y-4">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Cliente
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
              />
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 -mx-1">
              {filteredPatients.map((p) => {
                const selected = selectedPatientId === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full flex items-center gap-3 px-2 py-3 text-left ${
                      selected ? 'bg-rose-50 dark:bg-rose-950/40' : ''
                    }`}
                  >
                    <AvatarInitials name={p.fullName} size="md" />
                    <span
                      className={`flex-1 font-semibold text-sm ${
                        selected ? 'text-[#bd003c]' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {displayNameBySurname(p.fullName)}
                    </span>
                    {selected && <Check className="w-5 h-5 text-[#bd003c]" />}
                  </button>
                );
              })}
            </div>

            {onRequestNewClient && (
              <button
                type="button"
                onClick={() => onRequestNewClient(patientSearch.trim() || undefined)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#bd003c]/40 text-[#bd003c] font-bold text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Crear nuevo cliente
              </button>
            )}
          </div>
        )}

        {/* Paso 2: Tratamiento */}
        {step === 2 && (
          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 space-y-4">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Tratamiento
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar tratamiento..."
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
              />
            </div>

            {latestActiveTemplates.length === 0 && (
              <div className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800 rounded-xl px-3 py-3 space-y-3">
                <p>
                  {seedingTemplates
                    ? 'Cargando plantillas…'
                    : 'No hay plantillas en la base de datos.'}
                </p>
                {supabaseService.getLastTemplatesError() && (
                  <p className="text-xs font-medium opacity-90">
                    {supabaseService.getLastTemplatesError()}
                  </p>
                )}
                <button
                  type="button"
                  disabled={seedingTemplates}
                  onClick={async () => {
                    setSeedingTemplates(true);
                    try {
                      const list = await supabaseService.ensureDefaultTemplates();
                      if (list.length === 0) {
                        const detail =
                          supabaseService.getLastTemplatesError() ||
                          'Ejecuta en Supabase el SQL: 20261022_seed_consent_templates.sql';
                        alert(detail);
                      }
                    } finally {
                      setSeedingTemplates(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#373DA2] text-white text-xs font-extrabold disabled:opacity-60"
                >
                  {seedingTemplates ? 'Creando plantillas…' : 'Reintentar / cargar ejemplos'}
                </button>
              </div>
            )}

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

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredTemplates.map((t) => {
                const selected = selectedTemplateId === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 ${
                      selected
                        ? 'border-[#bd003c] bg-rose-50 dark:bg-rose-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {t.name}
                      </p>
                      <p className="text-[10px] font-bold text-[#bd003c] mt-0.5">
                        v{t.version} · ACTIVA
                      </p>
                    </div>
                    {selected && <Check className="w-5 h-5 text-[#bd003c] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Paso 3: Revisar */}
        {step === 3 && selectedPatient && selectedTemplate && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <AvatarInitials name={selectedPatient.fullName} size="lg" />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {displayNameBySurname(selectedPatient.fullName)}
                  </p>
                  <p className="text-xs text-slate-500">{selectedPatient.dni}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase">Tratamiento</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedTemplate.name}
                </p>
                <p className="text-[10px] font-bold text-[#bd003c]">
                  v{selectedTemplate.version} · {selectedTemplate.category}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 space-y-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                Título del documento
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="w-full py-3.5 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
              />
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Vista previa</p>
              {looksLikeHtml(selectedTemplate.content) ? (
                <div
                  className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-6 prose-consent"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedTemplate.content),
                  }}
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-6">
                  {htmlToPlainText(selectedTemplate.content)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer acciones */}
        <div className="fixed bottom-0 inset-x-0 lg:static lg:mt-5 z-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 lg:border-0 lg:bg-transparent p-4 lg:p-0 flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 1) onCancel();
              else setStep((step - 1) as Step);
            }}
            className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => void goNext()}
            className="flex-[1.4] py-3.5 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] disabled:opacity-40 text-white font-extrabold text-sm flex items-center justify-center gap-1.5"
          >
            {saving
              ? 'Generando…'
              : step === 3
                ? 'Generar Consentimiento'
                : 'Siguiente'}
            {!saving && step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
