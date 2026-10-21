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
  signedCount,
  activities,
  recentConsents,
  onNewClient,
  onNewConsent,
  onOpenSignModal,
  onNavigateTab,
}) => {
  const pendingPercentage = totalConsentsCount > 0
    ? Math.round((pendingCount / totalConsentsCount) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in max-w-5xl">
      {/* Greeting Section */}
      <div className="pt-2">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ¡Hola, {doctorName.split(' ')[1] ? `Dra. ${doctorName.split(' ')[1]}` : doctorName}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-1">
          Aquí tienes el resumen de hoy
        </p>
      </div>

      {/* Reduced Compact Pending Signatures Banner */}
      <div 
        onClick={() => onNavigateTab('consentimientos', 'PENDIENTE')}
        className="p-3.5 px-4 bg-[#fcf9f5] dark:bg-slate-800/90 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fef3c7] dark:bg-amber-950/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 text-[#d97706] dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">Firmas Pendientes</span>
              <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] dark:bg-amber-950/80 text-[#b45309] dark:text-amber-300 text-[10px] font-black">
                {pendingPercentage}% del total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Toca para ver y gestionar solicitudes pendientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#d97706] dark:text-amber-400">{pendingCount}</span>
          <ChevronRight className="w-5 h-5 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Primary Action Buttons (Nuevo Consentimiento & Nuevo Cliente) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Main CTA: Nuevo Consentimiento */}
        <button
          onClick={onNewConsent}
          className="w-full py-4 px-6 bg-[#373DA2] hover:bg-[#2b3085] active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <FilePlus className="w-6 h-6 stroke-[2.5] text-amber-300 group-hover:scale-110 transition-transform" />
          <span>Nuevo Consentimiento</span>
        </button>

        {/* Secondary Action: Nuevo Cliente */}
        <button
          onClick={onNewClient}
          className="w-full py-3.5 px-6 bg-[#bd003c] hover:bg-[#a00033] active:scale-[0.98] text-white rounded-2xl font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <UserPlus className="w-5 h-5 stroke-[2.5]" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Recent Activity Section (Actividad reciente) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Actividad reciente
          </h3>
          <button
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
                  if (!isSigned) {
                    onOpenSignModal(doc);
                  }
                }}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm transition-all cursor-pointer ${
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

                {/* Status Badges exact visual match */}
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
            );
          })}
        </div>
      </div>

      {/* Security & Cloud Badge */}
      <div className="p-4 bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Cifrado RGPD y firma biométrica vinculada a Supabase Cloud con respaldo de alta disponibilidad.
        </p>
      </div>
    </div>
  );
};
