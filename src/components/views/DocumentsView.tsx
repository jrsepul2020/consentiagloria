import React, { useState } from 'react';
import { Search, FileText, Plus, PenTool, ShieldCheck, Download, ExternalLink, FileCheck } from 'lucide-react';
import { Consent, DocumentStatus } from '../../types';
import { openOrDownloadConsentPdf } from '../../utils/pdfGenerator';
import { supabaseService } from '../../services/supabaseService';

interface DocumentsViewProps {
  documents: Consent[];
  onNewConsent: () => void;
  onOpenSignModal: (doc: Consent) => void;
  statusFilter?: 'TODOS' | DocumentStatus;
  onStatusFilterChange?: (status: 'TODOS' | DocumentStatus) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onNewConsent,
  onOpenSignModal,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [internalStatusFilter, setInternalStatusFilter] = useState<'TODOS' | DocumentStatus>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Consent | null>(null);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);

  const activeStatusFilter = statusFilter !== undefined ? statusFilter : internalStatusFilter;

  const handleSelectStatusFilter = (status: 'TODOS' | DocumentStatus) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    } else {
      setInternalStatusFilter(status);
    }
  };

  const handleOpenPdf = async (doc: Consent) => {
    setLoadingPdfId(doc.id);
    try {
      await openOrDownloadConsentPdf(doc, supabaseService.getClinicSettings());
    } catch (err) {
      console.error('Error opening PDF:', err);
    } finally {
      setLoadingPdfId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientDniSnapshot.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = activeStatusFilter === 'TODOS' || doc.status === activeStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in max-w-5xl">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Consentimientos Expedidos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Registro y custodia digital en la tabla <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">consents</code>
          </p>
        </div>

        <button
          onClick={onNewConsent}
          className="py-2.5 px-4 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Consentimiento
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, DNI, título o tratamiento..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden shadow-2xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {(['TODOS', 'PENDIENTE', 'FIRMADO'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleSelectStatusFilter(status)}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeStatusFilter === status
                ? 'bg-white dark:bg-slate-700 text-[#bd003c] dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="font-bold text-sm">No hay consentimientos en esta categoría</p>
            <p className="text-xs text-slate-500 mt-1">Intenta buscar otro término o cambiar el filtro</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSigned = doc.status === 'FIRMADO';

            return (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {doc.patientNameSnapshot}
                    </h3>
                    <p className="text-xs font-semibold text-[#bd003c] dark:text-rose-400 mt-0.5">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      DNI: {doc.patientDniSnapshot} • {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  <div>
                    {isSigned ? (
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#d1fae5] text-[#065f46] dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-extrabold tracking-wider uppercase">
                        FIRMADO
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/80 dark:text-amber-300 text-xs font-extrabold tracking-wider uppercase">
                        PENDIENTE
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Términos
                  </button>

                  {!isSigned ? (
                    <button
                      onClick={() => onOpenSignModal(doc)}
                      className="py-2 px-3.5 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Firmar Ahora
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPdf(doc)}
                        disabled={loadingPdfId === doc.id}
                        className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/30 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        {loadingPdfId === doc.id ? 'Generando...' : 'Descargar PDF'}
                      </button>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Verificado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document Terms Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-[#bd003c] dark:text-rose-400">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500">Paciente: {previewDoc.patientNameSnapshot} ({previewDoc.patientDniSnapshot})</p>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium space-y-3">
              <p className="whitespace-pre-wrap">{previewDoc.contentSnapshot}</p>
              {previewDoc.signatureData && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    Firma del Paciente:
                  </span>
                  <img
                    src={previewDoc.signatureData}
                    alt="Firma paciente"
                    className="h-16 bg-white p-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-200"
              >
                Cerrar
              </button>
              {previewDoc.status === 'FIRMADO' && (
                <button
                  onClick={() => {
                    handleOpenPdf(previewDoc);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Documento PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
