import React, { useEffect, useState } from 'react';
import { Search, Plus, FileCheck, ChevronRight } from 'lucide-react';
import { Consent, DocumentStatus } from '../../types';
import { AvatarInitials } from '../AvatarInitials';
import { StatusBadge } from '../StatusBadge';
import { supabaseService } from '../../services/supabaseService';

interface DocumentsViewProps {
  documents: Consent[];
  onNewConsent: () => void;
  onOpenConsent: (doc: Consent) => void;
  statusFilter?: 'TODOS' | DocumentStatus;
  onStatusFilterChange?: (status: 'TODOS' | DocumentStatus) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onNewConsent,
  onOpenConsent,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [internalStatusFilter, setInternalStatusFilter] = useState<'TODOS' | DocumentStatus>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const activeStatusFilter = statusFilter !== undefined ? statusFilter : internalStatusFilter;

  useEffect(() => {
    const t = setTimeout(() => {
      void supabaseService.searchConsents(searchTerm);
    }, 280);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelectStatusFilter = (status: 'TODOS' | DocumentStatus) => {
    if (onStatusFilterChange) onStatusFilterChange(status);
    else setInternalStatusFilter(status);
  };

  const filteredDocs = documents
    .filter((doc) => activeStatusFilter === 'TODOS' || doc.status === activeStatusFilter)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await supabaseService.loadMoreConsents();
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Consentimientos</h2>
        <button
          type="button"
          onClick={onNewConsent}
          className="py-2.5 px-4 bg-[#bd003c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
        />
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {(['TODOS', 'PENDIENTE', 'FIRMADO'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleSelectStatusFilter(status)}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold ${
              activeStatusFilter === status
                ? 'bg-white dark:bg-slate-700 text-[#bd003c] dark:text-rose-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">Sin consentimientos</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <button
              type="button"
              key={doc.id}
              onClick={() => onOpenConsent(doc)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <AvatarInitials name={doc.patientNameSnapshot} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {doc.patientNameSnapshot}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{doc.title}</p>
              </div>
              <StatusBadge status={doc.status} />
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))
        )}
      </div>

      {supabaseService.hasMoreConsents() && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300"
        >
          {loadingMore ? 'Cargando…' : 'Cargar más'}
        </button>
      )}
    </div>
  );
};
