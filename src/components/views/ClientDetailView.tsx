import React, { useState } from 'react';
import { Mail, Phone, IdCard, FilePlus, MapPin } from 'lucide-react';
import { Patient, Consent } from '../../types';
import { AvatarInitials } from '../AvatarInitials';
import { StatusBadge } from '../StatusBadge';
import { displayNameBySurname } from '../../utils/nameFormat';

interface ClientDetailViewProps {
  patient: Patient;
  consents: Consent[];
  onNewConsent: () => void;
  onOpenConsent: (consent: Consent) => void;
}

type Tab = 'historial' | 'datos' | 'documentos';

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  patient,
  consents,
  onNewConsent,
  onOpenConsent,
}) => {
  const [tab, setTab] = useState<Tab>('historial');
  const patientConsents = consents
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tabs: { id: Tab; label: string }[] = [
    { id: 'historial', label: 'Historial' },
    { id: 'datos', label: 'Datos' },
    { id: 'documentos', label: 'Documentos' },
  ];

  return (
    <div className="max-w-xl mx-auto pb-28 lg:pb-8 space-y-5">
      {/* Cabecera ficha */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-5 flex flex-col items-center text-center gap-3">
        <AvatarInitials name={patient.fullName} size="xl" />
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {displayNameBySurname(patient.fullName)}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center justify-center gap-1.5">
            <IdCard className="w-3.5 h-3.5" />
            {patient.dni}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
          {patient.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {patient.email}
            </span>
          )}
          {patient.phone && patient.phone !== '-' && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {patient.phone}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNewConsent}
          className="mt-1 w-full py-3 rounded-2xl bg-[#373DA2] text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          Nuevo consentimiento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold ${
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-[#bd003c] dark:text-rose-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'historial' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          {patientConsents.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">Sin historial</p>
          ) : (
            patientConsents.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => onOpenConsent(c)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </button>
            ))
          )}
        </div>
      )}

      {tab === 'datos' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 space-y-4">
          {[
            { label: 'Nombre completo', value: patient.fullName },
            { label: 'DNI / NIF', value: patient.dni },
            { label: 'Teléfono', value: patient.phone || '—' },
            { label: 'Email', value: patient.email || '—' },
            {
              label: 'Alta',
              value: new Date(patient.createdAt).toLocaleDateString('es-ES'),
            },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {row.label}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {row.value}
              </p>
            </div>
          ))}
          <div className="flex items-start gap-2 pt-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Dirección no registrada
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          {patientConsents.filter((c) => c.status === 'FIRMADO').length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">Sin documentos firmados</p>
          ) : (
            patientConsents
              .filter((c) => c.status === 'FIRMADO')
              .map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => onOpenConsent(c)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {c.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Firmado{' '}
                      {c.signedAt
                        ? new Date(c.signedAt).toLocaleDateString('es-ES')
                        : '—'}
                    </p>
                  </div>
                  <StatusBadge status="FIRMADO" />
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
};
