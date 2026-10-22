import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ChevronRight, Phone } from 'lucide-react';
import { Patient } from '../../types';
import { AvatarInitials } from '../AvatarInitials';
import {
  compareBySurnameThenName,
  displayNameBySurname,
} from '../../utils/nameFormat';
import { supabaseService } from '../../services/supabaseService';

interface ClientsViewProps {
  patients: Patient[];
  onNewClient: () => void;
  onOpenClient: (patient: Patient) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  patients,
  onNewClient,
  onOpenClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      void supabaseService.searchPatients(searchTerm);
    }, 280);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(
    () => [...patients].sort((a, b) => compareBySurnameThenName(a.fullName, b.fullName)),
    [patients]
  );

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await supabaseService.loadMorePatients();
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Clientes</h2>
        <button
          type="button"
          onClick={onNewClient}
          className="py-2.5 px-4 bg-[#bd003c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">
              {searchTerm ? 'Sin resultados' : 'No hay clientes'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={onNewClient}
                className="mt-3 px-4 py-2 bg-[#bd003c] text-white rounded-xl text-xs font-bold"
              >
                Registrar primero
              </button>
            )}
          </div>
        ) : (
          filtered.map((patient) => (
            <button
              type="button"
              key={patient.id}
              onClick={() => onOpenClient(patient)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <AvatarInitials name={patient.fullName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {displayNameBySurname(patient.fullName)}
                </p>
                {patient.phone && patient.phone !== '-' && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {patient.phone}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))
        )}
      </div>

      {supabaseService.hasMorePatients() && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300"
        >
          {loadingMore ? 'Cargando…' : 'Cargar más clientes'}
        </button>
      )}
    </div>
  );
};
