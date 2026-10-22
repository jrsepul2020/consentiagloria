import React from 'react';
import { Clock, UserPlus, FilePlus, ShieldCheck, ChevronRight } from 'lucide-react';
import { ActivityLog, Consent } from '../../types';
import { NavTab } from '../Sidebar';

interface HomeViewProps {
  doctorName: string;
  pendingCount: number;
  totalConsentsCount: number;
  signedCount: number;
  activities: ActivityLog[];
  recentConsents: Consent[];
  onNewClient: () => void;
  onNewConsent: () => void;
  onOpenSignModal: (consent: Consent) => void;
  onNavigateTab: (tab: NavTab, statusFilter?: 'TODOS' | 'PENDIENTE' | 'FIRMADO') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  doctorName,
  pendingCount,
  totalConsentsCount,
  recentConsents,
  onNewClient,
  onNewConsent,
  onOpenSignModal,
  onNavigateTab,
}) => {
  const pendingPercentage =
    totalConsentsCount > 0 ? Math.round((pendingCount / totalConsentsCount) * 100) : 0;

  return (
    <div className="space-y-4 lg:space-y-5 pb-24 lg:pb-6 max-w-5xl">
      {/* Greeting */}
      <div className="pt-1 lg:pt-2">
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ¡Hola, {doctorName.split(' ')[1] ? `Dra. ${doctorName.split(' ')[1]}` : doctorName}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm lg:text-base mt-1">
          Resumen de hoy
        </p>
      </div>

      {/* Firmas pendientes — naranja destacado */}
      <button
        type="button"
        onClick={() => onNavigateTab('consentimientos', 'PENDIENTE')}
        className="w-full p-5 lg:p-4 lg:px-4 bg-orange-500 hover:bg-orange-600 border-2 border-orange-600 dark:border-orange-400 rounded-2xl lg:rounded-2xl flex items-center justify-between gap-3 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 lg:w-10 lg:h-10 rounded-2xl lg:rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg lg:text-sm font-extrabold text-white">Firmas pendientes</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs lg:text-[10px] font-black">
                {pendingPercentage}%
              </span>
            </div>
            <p className="text-sm lg:text-xs text-orange-50 font-medium mt-0.5">
              Toca para gestionarlas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-4xl lg:text-2xl font-black text-white tabular-nums">{pendingCount}</span>
          <ChevronRight className="w-6 h-6 lg:w-5 lg:h-5 text-white" />
        </div>
      </button>

      {/* Acciones principales — grandes en móvil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-3">
        <button
          type="button"
          onClick={onNewConsent}
          className="w-full min-h-[4.5rem] lg:min-h-0 py-5 lg:py-4 px-6 bg-[#373DA2] hover:bg-[#2b3085] text-white rounded-2xl font-bold text-xl lg:text-lg flex items-center justify-center gap-3 cursor-pointer"
        >
          <FilePlus className="w-7 h-7 lg:w-6 lg:h-6 stroke-[2.5] text-amber-300 shrink-0" />
          <span>Nuevo consentimiento</span>
        </button>

        <button
          type="button"
          onClick={onNewClient}
          className="w-full min-h-[4.5rem] lg:min-h-0 py-5 lg:py-3.5 px-6 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-2xl font-bold text-xl lg:text-base flex items-center justify-center gap-3 cursor-pointer"
        >
          <UserPlus className="w-7 h-7 lg:w-5 lg:h-5 stroke-[2.5] shrink-0" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Actividad reciente — solo escritorio */}
      <div className="hidden lg:block space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Actividad reciente</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('consentimientos')}
            className="text-xs font-bold text-[#373DA2] dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            Ver todo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentConsents.map((doc) => {
            const isSigned = doc.status === 'FIRMADO';

            return (
              <div
                key={doc.id}
                onClick={() => {
                  if (!isSigned) onOpenSignModal(doc);
                }}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer ${
                  !isSigned ? 'hover:border-blue-300' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                    {doc.patientNameSnapshot}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {doc.category}
                  </p>
                </div>

                <div>
                  {isSigned ? (
                    <span className="inline-block px-3 py-1 rounded-xl bg-[#d1fae5] text-[#065f46] dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-extrabold tracking-wider uppercase">
                      FIRMADO
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-xl bg-orange-500 text-white text-xs font-extrabold tracking-wider uppercase">
                      PENDIENTE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge seguridad — solo escritorio */}
      <div className="hidden lg:flex p-4 bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Cifrado RGPD y firma biométrica vinculada a Supabase Cloud con respaldo de alta disponibilidad.
        </p>
      </div>
    </div>
  );
};
