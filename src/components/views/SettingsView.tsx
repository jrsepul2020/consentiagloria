import React, { useState } from 'react';
import {
  Building2,
  Users,
  LayoutTemplate,
  Bell,
  Shield,
  Download,
  Languages,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Check,
} from 'lucide-react';
import { ClinicSettings } from '../../types';

interface SettingsViewProps {
  clinicSettings: ClinicSettings;
  darkMode: boolean;
  userEmail?: string;
  onUpdateClinicSettings: (updates: Partial<ClinicSettings>) => void;
  onToggleDarkMode: () => void;
  onSimulatePush: () => void;
  onSignOut: () => void;
  onOpenTemplates: () => void;
  onOpenStats?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  clinicSettings,
  darkMode,
  userEmail,
  onUpdateClinicSettings,
  onToggleDarkMode,
  onSimulatePush,
  onSignOut,
  onOpenTemplates,
}) => {
  const [editingClinic, setEditingClinic] = useState(false);
  const [clinicName, setClinicName] = useState(clinicSettings.clinicName);
  const [professionalName, setProfessionalName] = useState(clinicSettings.professionalName);
  const [professionalTitle, setProfessionalTitle] = useState(clinicSettings.professionalTitle);
  const [medicalLicense, setMedicalLicense] = useState(clinicSettings.medicalLicense);
  const [email, setEmail] = useState(clinicSettings.email);
  const [phone, setPhone] = useState(clinicSettings.phone);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClinicSettings({
      clinicName,
      professionalName,
      professionalTitle,
      medicalLicense,
      email,
      phone,
    });
    setEditingClinic(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const menuItems = [
    {
      icon: Building2,
      label: 'Perfil y clínica',
      onClick: () => setEditingClinic(true),
    },
    {
      icon: Users,
      label: 'Usuarios',
      onClick: () => {},
      soon: true,
    },
    {
      icon: LayoutTemplate,
      label: 'Plantillas',
      onClick: onOpenTemplates,
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      onClick: onSimulatePush,
    },
    {
      icon: Shield,
      label: 'Seguridad',
      onClick: () => {},
      soon: true,
    },
    {
      icon: Download,
      label: 'Exportar datos',
      onClick: () => {},
      soon: true,
    },
    {
      icon: Languages,
      label: 'Idioma',
      detail: 'Español',
      onClick: () => {},
      soon: true,
    },
  ];

  if (editingClinic) {
    return (
      <div className="max-w-xl mx-auto pb-28 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Perfil y clínica</h2>
          <button
            type="button"
            onClick={() => setEditingClinic(false)}
            className="text-sm font-bold text-[#bd003c]"
          >
            Cerrar
          </button>
        </div>
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4"
        >
          {[
            { label: 'Clínica', value: clinicName, set: setClinicName },
            { label: 'Profesional', value: professionalName, set: setProfessionalName },
            { label: 'Título', value: professionalTitle, set: setProfessionalTitle },
            { label: 'Colegiado', value: medicalLicense, set: setMedicalLicense },
            { label: 'Email', value: email, set: setEmail, type: 'email' },
            { label: 'Teléfono', value: phone, set: setPhone, type: 'tel' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                {f.label}
              </label>
              <input
                type={f.type || 'text'}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium outline-hidden focus:ring-2 focus:ring-[#bd003c]"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#bd003c] text-white font-extrabold text-sm"
          >
            Guardar
          </button>
          {saved && (
            <p className="text-xs text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> Guardado
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-28 lg:pb-8 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Ajustes</h2>
        {userEmail && (
          <p className="text-sm text-slate-500 font-medium mt-1 truncate">{userEmail}</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Icon className="w-4.5 h-4.5 w-4 h-4" />
              </div>
              <span className="flex-1 font-bold text-sm text-slate-900 dark:text-white">
                {item.label}
              </span>
              {item.soon && (
                <span className="text-[9px] font-extrabold uppercase text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  Pronto
                </span>
              )}
              {item.detail && (
                <span className="text-xs text-slate-400 font-medium">{item.detail}</span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            {darkMode ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">Modo oscuro</span>
        </div>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={`w-12 h-6 flex items-center rounded-full p-1 ${darkMode ? 'bg-[#bd003c]' : 'bg-slate-300'}`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-[#bd003c] dark:text-rose-400 font-extrabold text-sm"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  );
};
