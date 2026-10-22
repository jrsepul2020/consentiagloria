import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, FileCheck, ChevronRight, CheckSquare, PenLine } from 'lucide-react';
import { Consent, DocumentStatus } from '../../types';
import { AvatarInitials } from '../AvatarInitials';
import { StatusBadge } from '../StatusBadge';
import { supabaseService } from '../../services/supabaseService';

interface DocumentsViewProps {
  documents: Consent[];
  onNewConsent: () => void;
  onOpenConsent: (doc: Consent) => void;
  onBatchSign?: (docs: Consent[]) => void;
  statusFilter?: 'TODOS' | DocumentStatus;
  onStatusFilterChange?: (status: 'TODOS' | DocumentStatus) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onNewConsent,
  onOpenConsent,
  onBatchSign,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [internalStatusFilter, setInternalStatusFilter] = useState<'TODOS' | DocumentStatus>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    setSelectedIds(new Set());
  };

  const categories = useMemo(() => {
    const set = new Set(documents.map((d) => d.category).filter(Boolean));
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [documents]);

  const filteredDocs = documents
    .filter((doc) => activeStatusFilter === 'TODOS' || doc.status === activeStatusFilter)
    .filter((doc) => categoryFilter === 'Todos' || doc.category === categoryFilter)
    .filter((doc) => {
      if (!dateFrom && !dateTo) return true;
      const d = (doc.signedAt || doc.createdAt || '').slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

  const selectedPending = filteredDocs.filter(
    (d) => selectedIds.has(d.id) && d.status === 'PENDIENTE'
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await supabaseService.loadMoreConsents();
    setLoadingMore(false);
  };

  const startBatch = () => {
    if (!onBatchSign || selectedPending.length === 0) return;
    const patientIds = new Set(selectedPending.map((c) => c.patientId));
    if (patientIds.size > 1) {
      alert(
        'Selecciona solo consentimientos del mismo paciente para firmar en una sola sesión.'
      );
      return;
    }
    onBatchSign(selectedPending);
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Consentimientos</h2>
        <div className="flex items-center gap-2">
          {onBatchSign && (
            <button
              type="button"
              onClick={() => {
                setSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                selectMode
                  ? 'bg-[#373DA2] text-white border-[#373DA2]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {selectMode ? 'Cancelar' : 'Varios'}
            </button>
          )}
          <button
            type="button"
            onClick={onNewConsent}
            className="py-2.5 px-4 bg-[#bd003c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente, tratamiento o categoría..."
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

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">Sin consentimientos</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const selected = selectedIds.has(doc.id);
            return (
              <div
                key={doc.id}
                className={`w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                  selected ? 'bg-rose-50/80 dark:bg-rose-950/30' : ''
                }`}
              >
                {selectMode && (
                  <button
                    type="button"
                    disabled={doc.status !== 'PENDIENTE'}
                    onClick={() => toggleSelect(doc.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      doc.status !== 'PENDIENTE'
                        ? 'opacity-30 border-slate-300'
                        : selected
                          ? 'bg-[#bd003c] border-[#bd003c] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                    }`}
                    aria-label="Seleccionar"
                  >
                    {selected && <span className="text-xs font-bold">✓</span>}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (selectMode ? toggleSelect(doc.id) : onOpenConsent(doc))}
                  className="min-w-0 flex-1 flex items-center gap-3 text-left"
                  disabled={selectMode && doc.status !== 'PENDIENTE'}
                >
                  <AvatarInitials name={doc.patientNameSnapshot} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {doc.patientNameSnapshot}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{doc.title}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                  {!selectMode && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {selectMode && selectedPending.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={startBatch}
            className="pointer-events-auto py-3.5 px-6 rounded-2xl bg-[#bd003c] text-white font-extrabold text-sm shadow-lg flex items-center gap-2"
          >
            <PenLine className="w-4 h-4" />
            Firmar {selectedPending.length} (1 firma)
          </button>
        </div>
      )}

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
