import React, { useEffect, useRef, useState } from 'react';
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
  PenLine,
  RotateCcw,
} from 'lucide-react';
import { ClinicSettings } from '../../types';
import { getStorageSignedUrl } from '../../lib/consentStorage';
import { supabaseService } from '../../services/supabaseService';

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
  const [doctorPreview, setDoctorPreview] = useState<string | null>(null);
  const [savingDoctorSig, setSavingDoctorSig] = useState(false);
  const [doctorSigSaved, setDoctorSigSaved] = useState(false);
  const [hasDrawnDoctorSig, setHasDrawnDoctorSig] = useState(false);
  const [redrawingDoctorSig, setRedrawingDoctorSig] = useState(false);

  const doctorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!clinicSettings.doctorSignaturePath) {
      setDoctorPreview(null);
      return;
    }
    void getStorageSignedUrl('clinic-assets', clinicSettings.doctorSignaturePath).then((url) => {
      setDoctorPreview(url);
    });
  }, [clinicSettings.doctorSignaturePath]);

  const setupDoctorCanvas = () => {
    const canvas = doctorCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const cssWidth = parent.clientWidth || 320;
    const cssHeight = 140;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (!editingClinic) return;
    if (doctorPreview && !redrawingDoctorSig) return;
    const t = requestAnimationFrame(() => setupDoctorCanvas());
    return () => cancelAnimationFrame(t);
  }, [editingClinic, doctorPreview, redrawingDoctorSig]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = doctorCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const canvas = doctorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = getPos(e);
    lastPointRef.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
    setHasDrawnDoctorSig(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = doctorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    const last = lastPointRef.current;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    setHasDrawnDoctorSig(true);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
  };

  const clearDoctorCanvas = () => {
    const canvas = doctorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasDrawnDoctorSig(false);
  };

  const handleSaveDoctorSignature = async () => {
    const canvas = doctorCanvasRef.current;
    if (!canvas || !hasDrawnDoctorSig) return;
    setSavingDoctorSig(true);
    setDoctorSigSaved(false);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const path = await supabaseService.setDoctorSignatureFromDataUrl(dataUrl);
      if (path) {
        setDoctorPreview(dataUrl);
        setRedrawingDoctorSig(false);
        setHasDrawnDoctorSig(false);
        setDoctorSigSaved(true);
        setTimeout(() => setDoctorSigSaved(false), 2500);
      } else {
        alert('No se pudo guardar la firma. Ejecuta la migración SQL (bucket clinic-assets).');
      }
    } finally {
      setSavingDoctorSig(false);
    }
  };

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

  const showDoctorPad = !doctorPreview || redrawingDoctorSig;

  if (editingClinic) {
    return (
      <div className="max-w-xl mx-auto pb-28 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Perfil y clínica</h2>
          <button
            type="button"
            onClick={() => {
              setEditingClinic(false);
              setRedrawingDoctorSig(false);
            }}
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

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-[#bd003c]" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Firma de la doctora
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Firme una sola vez aquí (trackpad, dedo o ratón). Se usará automáticamente en todos
              los PDFs.
            </p>

            {doctorPreview && !redrawingDoctorSig && (
              <div className="space-y-2">
                <img
                  src={doctorPreview}
                  alt="Firma doctora guardada"
                  className="w-full max-h-28 object-contain bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    setRedrawingDoctorSig(true);
                    setHasDrawnDoctorSig(false);
                  }}
                  className="text-xs font-bold text-[#bd003c]"
                >
                  Volver a firmar
                </button>
              </div>
            )}

            {showDoctorPad && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">Dibuje su firma</p>
                  <button
                    type="button"
                    onClick={clearDoctorCanvas}
                    className="text-xs font-bold text-[#bd003c] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                </div>
                <div className="relative w-full">
                  <canvas
                    ref={doctorCanvasRef}
                    className="block w-full h-36 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl touch-none cursor-crosshair"
                    style={{ touchAction: 'none' }}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                  />
                  {!hasDrawnDoctorSig && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-slate-400">Firma aquí</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {redrawingDoctorSig && (
                    <button
                      type="button"
                      onClick={() => {
                        setRedrawingDoctorSig(false);
                        setHasDrawnDoctorSig(false);
                      }}
                      className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!hasDrawnDoctorSig || savingDoctorSig}
                    onClick={handleSaveDoctorSignature}
                    className="flex-1 py-3 rounded-2xl bg-[#373DA2] text-white text-sm font-extrabold disabled:opacity-40"
                  >
                    {savingDoctorSig
                      ? 'Guardando…'
                      : doctorSigSaved
                        ? '✓ Guardada'
                        : 'Guardar firma'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#bd003c] text-white font-extrabold text-sm"
          >
            Guardar perfil
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
                <Icon className="w-4 h-4" />
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
