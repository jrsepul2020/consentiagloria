import React from 'react';
import { FilePlus, UserPlus, ChevronRight, BarChart3 } from 'lucide-react';
import { Consent } from '../../types';
import { NavTab } from '../Sidebar';
import { AvatarInitials } from '../AvatarInitials';
import { StatusBadge } from '../StatusBadge';
import { formatLongDate, formatRelativeTime } from '../../utils/nameFormat';

interface HomeViewProps {
  doctorName: string;
  pendingCount: number;
  totalConsentsCount: number;
  signedCount: number;
  signedTodayCount: number;
  weekCount: number;
  recentConsents: Consent[];
  onNewClient: () => void;
  onNewConsent: () => void;
  onOpenConsent: (consent: Consent) => void;
  onOpenStats: () => void;
  onNavigateTab: (tab: NavTab, statusFilter?: 'TODOS' | 'PENDIENTE' | 'FIRMADO') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  doctorName,
  pendingCount,
  totalConsentsCount,
  signedTodayCount,
  weekCount,
  recentConsents,
  onNewClient,
  onNewConsent,
  onOpenConsent,
  onOpenStats,
  onNavigateTab,
}) => {
  const pendingPct =
    totalConsentsCount > 0 ? Math.round((pendingCount / totalConsentsCount) * 100) : 0;
  const firstName = doctorName.split(' ')[1] || doctorName.split(' ')[0] || doctorName;

  return (
    <div className="space-y-5 pb-24 lg:pb-6 max-w-5xl">
      <div className="pt-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ¡Hola, Dra. {firstName}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 capitalize">
            {formatLongDate()}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStats}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#373DA2] dark:text-blue-300"
          aria-label="Estadísticas"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      {/* 3 tarjetas de métricas */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('consentimientos', 'PENDIENTE')}
          className="p-3 sm:p-4 rounded-2xl bg-orange-500 text-white text-left"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-orange-100">
            Pendientes
          </p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">{pendingCount}</p>
          <p className="text-[10px] sm:text-xs font-semibold text-orange-100 mt-0.5">{pendingPct}%</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('consentimientos', 'FIRMADO')}
          className="p-3 sm:p-4 rounded-2xl bg-emerald-500 text-white text-left"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-emerald-100">
            Firmados hoy
          </p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">{signedTodayCount}</p>
        </button>

        <button
          type="button"
          onClick={onOpenStats}
          className="p-3 sm:p-4 rounded-2xl bg-[#373DA2] text-white text-left"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-blue-200">
            Esta semana
          </p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">{weekCount}</p>
        </button>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onNewConsent}
          className="w-full min-h-[3.75rem] py-4 px-5 bg-[#373DA2] hover:bg-[#2b3085] text-white rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3"
        >
          <FilePlus className="w-6 h-6 shrink-0" />
          Nuevo consentimiento
        </button>
        <button
          type="button"
          onClick={onNewClient}
          className="w-full min-h-[3.75rem] py-4 px-5 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3"
        >
          <UserPlus className="w-6 h-6 shrink-0" />
          Nuevo cliente
        </button>
      </div>

      {/* Actividad reciente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Actividad reciente</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('consentimientos')}
            className="text-xs font-bold text-[#373DA2] dark:text-blue-400 flex items-center gap-0.5"
          >
            Ver todo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
          {recentConsents.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center font-medium">Sin actividad aún</p>
          ) : (
            recentConsents.map((doc) => (
              <button
                type="button"
                key={doc.id}
                onClick={() => onOpenConsent(doc)}
                className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <AvatarInitials name={doc.patientNameSnapshot} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {doc.patientNameSnapshot}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {doc.title}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={doc.status} />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatRelativeTime(doc.updatedAt || doc.createdAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
