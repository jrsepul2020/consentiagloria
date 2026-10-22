import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Send, Search, ChevronDown, Check, UserPlus } from 'lucide-react';
import { Patient, ConsentTemplate } from '../../types';

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
  }) => void;
}

/** Nombre = primera palabra; apellidos = resto (orden: apellidos, nombre). */
function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function displayNameBySurname(fullName: string) {
  const { firstName, lastName } = splitFullName(fullName);
  if (!lastName || lastName === firstName) return firstName;
  return `${lastName}, ${firstName}`;
}

function compareBySurnameThenName(a: string, b: string) {
  const pa = splitFullName(a);
  const pb = splitFullName(b);
  const byLast = pa.lastName.localeCompare(pb.lastName, 'es', { sensitivity: 'base' });
  if (byLast !== 0) return byLast;
  return pa.firstName.localeCompare(pb.firstName, 'es', { sensitivity: 'base' });
}

export const NewConsentView: React.FC<NewConsentViewProps> = ({
  patients,
  templates,
  preselectedPatientId,
  preselectedTemplateId,
  onCancel,
  onRequestNewClient,
  onCreateConsent,
}) => {
  const latestActiveTemplates = useMemo(() => {
    const active = templates.filter((t) => t.active);
    const mapByName = new Map<string, ConsentTemplate>();

    active.forEach((tmpl) => {
      const key = tmpl.name.trim().toLowerCase();
      const existing = mapByName.get(key);
      if (!existing || tmpl.version > existing.version) {
        mapByName.set(key, tmpl);
      }
    });

    return Array.from(mapByName.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [templates]);

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => compareBySurnameThenName(a.fullName, b.fullName)),
    [patients]
  );

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);

  const selectedPatient = useMemo(
    () => sortedPatients.find((p) => p.id === selectedPatientId) || null,
    [sortedPatients, selectedPatientId]
  );

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return sortedPatients.slice(0, 80);
    const term = patientSearch.toLowerCase().trim();
    return sortedPatients
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(term) ||
          displayNameBySurname(p.fullName).toLowerCase().includes(term) ||
          p.dni.toLowerCase().includes(term)
      )
      .slice(0, 80);
  }, [sortedPatients, patientSearch]);

  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = useMemo(() => {
    return (
      latestActiveTemplates.find((t) => t.id === selectedTemplateId) ||
      (latestActiveTemplates.length > 0 ? latestActiveTemplates[0] : null)
    );
  }, [latestActiveTemplates, selectedTemplateId]);

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return latestActiveTemplates;
    const term = templateSearch.toLowerCase().trim();
    return latestActiveTemplates.filter(
      (t) => t.name.toLowerCase().includes(term) || t.category.toLowerCase().includes(term)
    );
  }, [latestActiveTemplates, templateSearch]);

  useEffect(() => {
    if (preselectedPatientId && sortedPatients.some((p) => p.id === preselectedPatientId)) {
      setSelectedPatientId(preselectedPatientId);
    } else if (sortedPatients.length > 0) {
      setSelectedPatientId(sortedPatients[0].id);
    } else {
      setSelectedPatientId(null);
    }

    if (preselectedTemplateId && latestActiveTemplates.some((t) => t.id === preselectedTemplateId)) {
      setSelectedTemplateId(preselectedTemplateId);
    } else if (latestActiveTemplates.length > 0) {
      setSelectedTemplateId(latestActiveTemplates[0].id);
    } else {
      setSelectedTemplateId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preselectedPatientId) return;
    if (sortedPatients.some((p) => p.id === preselectedPatientId)) {
      setSelectedPatientId(preselectedPatientId);
      setPatientSearch('');
      setIsPatientDropdownOpen(false);
    }
  }, [preselectedPatientId, sortedPatients]);

  useEffect(() => {
    if (!selectedPatientId) return;
    if (sortedPatients.some((p) => p.id === selectedPatientId)) return;
    if (preselectedPatientId && sortedPatients.some((p) => p.id === preselectedPatientId)) {
      setSelectedPatientId(preselectedPatientId);
      return;
    }
    if (sortedPatients.length > 0) setSelectedPatientId(sortedPatients[0].id);
  }, [sortedPatients, selectedPatientId, preselectedPatientId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedTemplate) return;

    onCreateConsent({
      patientId: selectedPatient.id,
      patientNameSnapshot: selectedPatient.fullName,
      patientDniSnapshot: selectedPatient.dni,
      templateId: selectedTemplate.id,
      title: selectedTemplate.name,
      category: selectedTemplate.category,
      templateVersion: selectedTemplate.version,
      contentSnapshot: selectedTemplate.content,
    });
  };

  const fieldClass =
    'w-full pl-11 pr-11 py-4 border border-slate-200 rounded-2xl text-base font-medium bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-[#bd003c] outline-hidden dark:bg-slate-950 dark:border-slate-700 dark:text-white';

  return (
    <div className="max-w-xl mx-auto pb-28 lg:pb-8 -mx-1">
      <div className="rounded-3xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 rounded-2xl text-[#bd003c] dark:text-rose-400">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Nuevo consentimiento</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Cliente — panel blanco */}
          <div
            className="relative space-y-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm"
            ref={patientRef}
          >
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Cliente *
            </label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={patientSearch}
                onFocus={() => setIsPatientDropdownOpen(true)}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setIsPatientDropdownOpen(true);
                }}
                placeholder={
                  selectedPatient
                    ? displayNameBySurname(selectedPatient.fullName)
                    : 'Buscar cliente...'
                }
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <ChevronDown className={`w-5 h-5 ${isPatientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isPatientDropdownOpen && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 overflow-hidden flex flex-col max-h-64">
                <div className="overflow-y-auto p-1.5 flex-1 min-h-0">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400 text-center font-medium">
                      Sin resultados
                    </div>
                  ) : (
                    filteredPatients.map((patient) => {
                      const isSelected = patient.id === selectedPatientId;
                      return (
                        <button
                          type="button"
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setPatientSearch('');
                            setIsPatientDropdownOpen(false);
                          }}
                          className={`w-full p-3.5 rounded-xl text-left flex items-center justify-between ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-[#bd003c] dark:text-rose-400 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-semibold text-base">
                            {displayNameBySurname(patient.fullName)}
                          </span>
                          {isSelected && <Check className="w-5 h-5 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {onRequestNewClient && (
                  <button
                    type="button"
                    onClick={() => {
                      const draft = patientSearch.trim();
                      setIsPatientDropdownOpen(false);
                      onRequestNewClient(draft || undefined);
                    }}
                    className="shrink-0 flex items-center gap-2 w-full px-4 py-4 text-left text-base font-bold text-[#bd003c] dark:text-rose-400 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800"
                  >
                    <UserPlus className="w-5 h-5 shrink-0" />
                    Crear nuevo cliente
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tratamiento — panel blanco */}
          <div
            className="relative space-y-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm"
            ref={templateRef}
          >
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Tratamiento *
            </label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={templateSearch}
                onFocus={() => setIsTemplateDropdownOpen(true)}
                onChange={(e) => {
                  setTemplateSearch(e.target.value);
                  setIsTemplateDropdownOpen(true);
                }}
                placeholder={selectedTemplate ? selectedTemplate.name : 'Buscar tratamiento...'}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <ChevronDown className={`w-5 h-5 ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isTemplateDropdownOpen && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto p-1.5">
                {filteredTemplates.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center font-medium">
                    Sin resultados
                  </div>
                ) : (
                  filteredTemplates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    return (
                      <button
                        type="button"
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          setTemplateSearch('');
                          setIsTemplateDropdownOpen(false);
                        }}
                        className={`w-full p-3.5 rounded-xl text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-[#bd003c] dark:text-rose-400 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span className="font-semibold text-base truncate">{tmpl.name}</span>
                        {isSelected && <Check className="w-5 h-5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Título
            </label>
            <input
              type="text"
              readOnly
              value={selectedTemplate?.name || ''}
              className="w-full text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed outline-hidden"
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Texto
            </label>
            <textarea
              readOnly
              rows={5}
              value={selectedTemplate?.content || ''}
              className="w-full text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium leading-relaxed cursor-not-allowed outline-hidden"
            />
          </div>

          <div className="pt-1 space-y-3">
            <button
              type="submit"
              disabled={!selectedPatient || !selectedTemplate}
              className="w-full min-h-[3.5rem] py-4 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Crear y enviar a firma
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-white/70 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
