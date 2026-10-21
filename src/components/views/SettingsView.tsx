import React, { useState } from 'react';
import { Moon, Sun, Bell, Database, ShieldCheck, Check, Smartphone, Lock, RefreshCw, Building2, User } from 'lucide-react';
import { ClinicSettings } from '../../types';

interface SettingsViewProps {
  clinicSettings: ClinicSettings;
  darkMode: boolean;
  onUpdateClinicSettings: (updates: Partial<ClinicSettings>) => void;
  onToggleDarkMode: () => void;
  onSimulatePush: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  clinicSettings,
  darkMode,
  onUpdateClinicSettings,
  onToggleDarkMode,
  onSimulatePush,
}) => {
  const [editing, setEditing] = useState(false);
  const [clinicName, setClinicName] = useState(clinicSettings.clinicName);
  const [professionalName, setProfessionalName] = useState(clinicSettings.professionalName);
  const [professionalTitle, setProfessionalTitle] = useState(clinicSettings.professionalTitle);
  const [medicalLicense, setMedicalLicense] = useState(clinicSettings.medicalLicense);
  const [email, setEmail] = useState(clinicSettings.email);
  const [phone, setPhone] = useState(clinicSettings.phone);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClinicSettings({ clinicName, professionalName, professionalTitle, medicalLicense, email, phone });
    setEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Ajustes & Configuración
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Datos de clínica y preferencias de la aplicación
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dark Mode */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-amber-400">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Modo Oscuro</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tema para baja luminosidad</p>
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-[#bd003c]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Push Notifications Simulation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-[#bd003c] dark:text-rose-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notificaciones Push</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Actividad de firmas en sesión</p>
            </div>
          </div>
          <button
            onClick={onSimulatePush}
            className="w-full py-2.5 px-3 bg-rose-50 dark:bg-rose-950/30 text-[#bd003c] dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold border border-rose-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Probar Notificación Push
          </button>
        </div>
      </div>

      {/* Clinic Profile Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Datos de la Clínica</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sincronizado con Supabase Cloud</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs font-bold text-[#bd003c] dark:text-rose-400 hover:underline"
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {!editing ? (
          /* Read-only view */
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 text-[#bd003c] dark:text-rose-400 font-extrabold text-base flex items-center justify-center border-2 border-[#bd003c] shrink-0">
                {clinicSettings.professionalName.charAt(0)}
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white">{clinicSettings.professionalName}</p>
                <p className="text-xs text-[#bd003c] dark:text-rose-400 font-bold">{clinicSettings.professionalTitle}</p>
                {clinicSettings.medicalLicense && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{clinicSettings.medicalLicense}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{clinicSettings.clinicName}</span>
              </div>
              {clinicSettings.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-3.5">@</span>
                  <span>{clinicSettings.email}</span>
                </div>
              )}
              {clinicSettings.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 w-3.5">📞</span>
                  <span>{clinicSettings.phone}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit form */
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre Clínica</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre Profesional</label>
                <input
                  type="text"
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Título</label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nº Colegiado</label>
                <input
                  type="text"
                  value={medicalLicense}
                  onChange={(e) => setMedicalLicense(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#bd003c] hover:bg-[#a00033] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Guardar Cambios
            </button>

            {savedSuccess && (
              <p className="text-xs text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Datos guardados correctamente
              </p>
            )}
          </form>
        )}
      </div>

      {/* Security Info */}
      <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Database className="w-4 h-4 text-emerald-500" />
          Supabase Cloud · Cifrado RGPD
        </div>
        <p className="leading-relaxed">
          Datos almacenados con cifrado de extremo a extremo y respaldo de alta disponibilidad. Consentimientos firmados en el bucket privado <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">consent-pdfs</code>.
        </p>
      </div>
    </div>
  );
};
