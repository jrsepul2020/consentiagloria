import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  Send,
  Sparkles,
  AlertCircle,
  Search,
  Lock,
  Tag,
  UserCheck,
  ChevronDown,
  Check,
  IdCard,
} from 'lucide-react';
import { Patient, ConsentTemplate } from '../types';

interface NewConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  templates: ConsentTemplate[];
  preselectedPatientId?: string;
  preselectedTemplateId?: string;
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

export const NewConsentModal: React.FC<NewConsentModalProps> = ({
  isOpen,
  onClose,
  patients,
  templates,
  preselectedPatientId,
  preselectedTemplateId,
  onCreateConsent,
}) => {
  // 1. Process active templates: highest version per unique treatment name
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

    return Array.from(mapByName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  // ── Patient Selection Combobox State ──────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);

  // Selected Patient object
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Filtered Patients (instant search by name or DNI)
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 50); // limit 50 when no query
    const term = patientSearch.toLowerCase().trim();
    return patients
      .filter((p) => p.fullName.toLowerCase().includes(term) || p.dni.toLowerCase().includes(term))
      .slice(0, 50);
  }, [patients, patientSearch]);

  // ── Treatment Selection Combobox State ────────────────────────────────────
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Selected Template object
  const selectedTemplate = useMemo(() => {
    return (
      latestActiveTemplates.find((t) => t.id === selectedTemplateId) ||
      (latestActiveTemplates.length > 0 ? latestActiveTemplates[0] : null)
    );
  }, [latestActiveTemplates, selectedTemplateId]);

  // Filtered Treatments (instant search by name or category)
  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return latestActiveTemplates;
    const term = templateSearch.toLowerCase().trim();
    return latestActiveTemplates.filter(
      (t) => t.name.toLowerCase().includes(term) || t.category.toLowerCase().includes(term)
    );
  }, [latestActiveTemplates, templateSearch]);

  // Sync state on modal open / props change
  useEffect(() => {
    if (isOpen) {
      // Patient preselection
      if (preselectedPatientId && patients.some((p) => p.id === preselectedPatientId)) {
        setSelectedPatientId(preselectedPatientId);
      } else if (patients.length > 0) {
        setSelectedPatientId(patients[0].id);
      } else {
        setSelectedPatientId(null);
      }

      // Template preselection
      if (preselectedTemplateId && latestActiveTemplates.some((t) => t.id === preselectedTemplateId)) {
        setSelectedTemplateId(preselectedTemplateId);
      } else if (latestActiveTemplates.length > 0) {
        setSelectedTemplateId(latestActiveTemplates[0].id);
      } else {
        setSelectedTemplateId(null);
      }

      setPatientSearch('');
      setTemplateSearch('');
      setIsPatientDropdownOpen(false);
      setIsTemplateDropdownOpen(false);
    }
  }, [isOpen, preselectedPatientId, preselectedTemplateId, patients, latestActiveTemplates]);

  // Close dropdowns on outside click
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
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    Nuevo Consentimiento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Búsqueda instantánea de cliente y tratamiento
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* ── 1. PATIENT COMBOBOX ────────────────────────────────────────────── */}
              <div className="space-y-1.5 relative" ref={patientRef}>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                  <span>Seleccionar Cliente / Paciente *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Buscar por Nombre o DNI</span>
                </label>

                {/* Selected Pill or Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
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
                        ? `${selectedPatient.fullName} (${selectedPatient.dni})`
                        : 'Buscar cliente por nombre o DNI...'
                    }
                    className={`w-full pl-10 pr-9 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-sm font-medium transition-all ${
                      selectedPatient && !patientSearch
                        ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#bd003c]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isPatientDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Patient Dropdown List */}
                {isPatientDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">
                        No se encontraron clientes coincidentes
                      </div>
                    ) : (
                      filteredPatients.map((patient) => {
                        const isSelected = patient.id === selectedPatientId;
                        return (
                          <div
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setPatientSearch('');
                              setIsPatientDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-[#bd003c] dark:text-rose-400 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-extrabold block text-sm">{patient.fullName}</span>
                              <span className="text-[11px] opacity-75 font-medium flex items-center gap-1 mt-0.5">
                                <IdCard className="w-3 h-3 text-slate-400" /> DNI: {patient.dni}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#bd003c] dark:text-rose-400" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* ── 2. TREATMENT COMBOBOX ────────────────────────────────────────── */}
              <div className="space-y-1.5 relative" ref={templateRef}>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Seleccionar Tratamiento / Plantilla *
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Solo modelos activos</span>
                </label>

                {/* Selected Pill or Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={templateSearch}
                    onFocus={() => setIsTemplateDropdownOpen(true)}
                    onChange={(e) => {
                      setTemplateSearch(e.target.value);
                      setIsTemplateDropdownOpen(true);
                    }}
                    placeholder={
                      selectedTemplate
                        ? `${selectedTemplate.name} (v${selectedTemplate.version})`
                        : 'Buscar tratamiento por nombre o categoría...'
                    }
                    className={`w-full pl-10 pr-9 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-sm font-medium transition-all ${
                      selectedTemplate && !templateSearch
                        ? 'border-rose-500/80 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#bd003c]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Treatment Dropdown List */}
                {isTemplateDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredTemplates.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">
                        No se encontraron tratamientos activos coincidentes
                      </div>
                    ) : (
                      filteredTemplates.map((tmpl) => {
                        const isSelected = tmpl.id === selectedTemplateId;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id);
                              setTemplateSearch('');
                              setIsTemplateDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-[#bd003c] dark:text-rose-400 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm truncate">{tmpl.name}</span>
                                <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-[#bd003c] dark:text-rose-400 text-[10px] font-black rounded-md shrink-0">
                                  v{tmpl.version}
                                </span>
                              </div>
                              <span className="text-[11px] opacity-75 font-medium block truncate mt-0.5">
                                {tmpl.category}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#bd003c] dark:text-rose-400 shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. SELECTED SUMMARY BADGE ────────────────────────────────────── */}
              {selectedTemplate && (
                <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#bd003c] dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> {selectedTemplate.category}
                    </span>
                    <span className="px-2 py-0.5 bg-[#bd003c] text-white text-[10px] font-black rounded-md uppercase">
                      Versión v{selectedTemplate.version} (Activa)
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedTemplate.name}
                  </h4>
                </div>
              )}

              {/* ── 4. READ-ONLY TITLE & CONTENT ─────────────────────────────────── */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Título del Documento (Modo Lectura)
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedTemplate?.name || ''}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Texto del Consentimiento (Modo Lectura)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Edición en módulo Plantillas</span>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={selectedTemplate?.content || ''}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium leading-relaxed cursor-not-allowed outline-hidden"
                />
              </div>

              {/* Info Alert */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-900/30">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                Se vinculará el consentimiento a {selectedPatient ? selectedPatient.fullName : 'un cliente'} y se enviará para firma.
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedPatient || !selectedTemplate}
                  className="w-full py-4 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Send className="w-5 h-5" />
                  Crear y Enviar a Firma
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
