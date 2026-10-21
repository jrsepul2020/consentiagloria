import React, { useState } from 'react';
import { Search, UserPlus, Phone, PhoneOff, Mail, Plus, ChevronRight, IdCard } from 'lucide-react';
import { Patient } from '../../types';

interface ClientsViewProps {
  patients: Patient[];
  onNewClient: () => void;
  onNewConsentForPatient: (patientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  patients,
  onNewClient,
  onNewConsentForPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const hasPhone = (phone?: string) => {
    if (!phone) return false;
    const trimmed = phone.trim().toLowerCase();
    return trimmed !== '' && trimmed !== '-';
  };

  const filteredPatients = patients.filter((p) => {
    return (
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in max-w-5xl">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Clientes & Pacientes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {patients.length} expedientes registrados
          </p>
        </div>

        <button
          onClick={onNewClient}
          className="py-2.5 px-4 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, DNI, teléfono o email..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#bd003c] outline-hidden shadow-2xs"
        />
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPatients.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6">
            <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">
              {patients.length === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
            </p>
            {patients.length === 0 && (
              <button
                onClick={onNewClient}
                className="mt-3 px-4 py-2 bg-[#bd003c] text-white rounded-xl text-xs font-bold"
              >
                Añadir primer cliente
              </button>
            )}
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const clientHasPhone = hasPhone(patient.phone);

            return (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Call button / Phone icon */}
                    {clientHasPhone ? (
                      <a
                        href={`tel:${patient.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`Llamar a ${patient.fullName}`}
                        className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-2xs group"
                      >
                        <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <div
                        title="Sin teléfono registrado"
                        className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 opacity-60"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {patient.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <IdCard className="w-3 h-3" />
                        {patient.dni}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </div>

                {/* Actions row */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[130px]">{patient.email || '—'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewConsentForPatient(patient.id);
                    }}
                    className="text-xs font-extrabold text-[#bd003c] dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Consentimiento
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {hasPhone(selectedPatient.phone) ? (
                  <a
                    href={`tel:${selectedPatient.phone}`}
                    title={`Llamar a ${selectedPatient.fullName}`}
                    className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shrink-0"
                  >
                    <Phone className="w-6 h-6" />
                  </a>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0 opacity-60">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {selectedPatient.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <IdCard className="w-3 h-3" /> {selectedPatient.dni}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  {hasPhone(selectedPatient.phone) ? (
                    <>
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <a href={`tel:${selectedPatient.phone}`} className="font-bold hover:underline text-emerald-700 dark:text-emerald-400">
                        {selectedPatient.phone}
                      </a>
                    </>
                  ) : (
                    <>
                      <PhoneOff className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 italic">Sin teléfono</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#bd003c]" />
                  <span>{selectedPatient.email || '—'}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => {
                  const id = selectedPatient.id;
                  setSelectedPatient(null);
                  onNewConsentForPatient(id);
                }}
                className="w-full py-3 bg-[#bd003c] hover:bg-[#a00033] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nuevo Consentimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
