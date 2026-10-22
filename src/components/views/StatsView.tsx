import React, { useMemo } from 'react';
import { Consent } from '../../types';

interface StatsViewProps {
  consents: Consent[];
}

export const StatsView: React.FC<StatsViewProps> = ({ consents }) => {
  const stats = useMemo(() => {
    const total = consents.length;
    const firmados = consents.filter((c) => c.status === 'FIRMADO').length;
    const pendientes = consents.filter((c) => c.status === 'PENDIENTE').length;
    const borradores = consents.filter((c) => c.status === 'BORRADOR').length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    // Últimas 12 semanas (aprox. 3 meses)
    const weeks: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7 - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const count = consents.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= start && d < end;
      }).length;
      const label = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      weeks.push({ label, count });
    }

    const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

    return { total, firmados, pendientes, borradores, pct, weeks, maxWeek };
  }, [consents]);

  return (
    <div className="max-w-xl mx-auto pb-28 lg:pb-8 space-y-5">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Estadísticas</h2>

      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total consentimientos</p>
        <p className="text-5xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
          {stats.total}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
            Firmados
          </p>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
            {stats.firmados}
          </p>
          <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
            {stats.pct(stats.firmados)}%
          </p>
        </div>
        <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-700 dark:text-orange-300">
            Pendientes
          </p>
          <p className="text-2xl font-black text-orange-800 dark:text-orange-200 mt-1">
            {stats.pendientes}
          </p>
          <p className="text-[10px] font-semibold text-orange-600 mt-0.5">
            {stats.pct(stats.pendientes)}%
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 p-3 text-center">
          <p className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
            Borradores
          </p>
          <p className="text-2xl font-black text-sky-800 dark:text-sky-200 mt-1">
            {stats.borradores}
          </p>
          <p className="text-[10px] font-semibold text-sky-600 mt-0.5">
            {stats.pct(stats.borradores)}%
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5">
        <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
          Consentimientos por semana
        </p>
        <div className="flex items-end gap-1.5 h-36">
          {stats.weeks.map((w) => (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-full rounded-t-md bg-[#373DA2] min-h-[4px]"
                style={{ height: `${(w.count / stats.maxWeek) * 100}%` }}
                title={`${w.count}`}
              />
              <span className="text-[8px] text-slate-400 font-medium truncate w-full text-center">
                {w.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
