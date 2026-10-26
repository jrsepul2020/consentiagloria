import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { Consent } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { openOrDownloadConsentPdf } from '../../utils/pdfGenerator';
import { supabaseService } from '../../services/supabaseService';
import { getStorageSignedUrl } from '../../lib/consentStorage';
import { isNeuromodulatorConsent } from '../../utils/consentHelpers';
import { looksLikeHtml, sanitizeHtml } from '../../utils/htmlContent';

interface ConsentDetailViewProps {
  document: Consent;
  onSignComplete: (consentId: string, signatureData: string) => void;
  onClose: () => void;
}

type Tab = 'preview' | 'datos' | 'firmas' | 'historial';

export const ConsentDetailView: React.FC<ConsentDetailViewProps> = ({
  document,
  onSignComplete,
  onClose,
}) => {
  const [tab, setTab] = useState<Tab>(document.status === 'PENDIENTE' ? 'firmas' : 'preview');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [storedSignatureUrl, setStoredSignatureUrl] = useState<string | null>(null);
  const isNeuro = isNeuromodulatorConsent(document);
  const [adminNumber, setAdminNumber] = useState(document.administrationNumber || '');
  const [adminDate, setAdminDate] = useState(
    document.administrationDate || new Date().toISOString().slice(0, 10)
  );
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const cssWidth = parent.clientWidth || 340;
    const cssHeight = 176;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#bd003c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    setAccepted(false);
    setShowError(false);
    setHasSignature(false);
    drawingRef.current = false;
    lastPointRef.current = null;
    setTab(document.status === 'PENDIENTE' ? 'firmas' : 'preview');
    setStoredSignatureUrl(null);

    if (document.signaturePath) {
      void getStorageSignedUrl('consent-signatures', document.signaturePath).then((url) => {
        if (url) setStoredSignatureUrl(url);
      });
    } else if (document.signatureData?.startsWith('data:image')) {
      setStoredSignatureUrl(document.signatureData);
    }
    setAdminNumber(document.administrationNumber || '');
    setAdminDate(document.administrationDate || new Date().toISOString().slice(0, 10));
  }, [document.id, document.status, document.signaturePath, document.signatureData, document.administrationNumber, document.administrationDate]);

  const saveAdministration = async () => {
    setSavingAdmin(true);
    setAdminSaved(false);
    try {
      await supabaseService.updateConsentAdministration(document.id, {
        administrationNumber: adminNumber.trim(),
        administrationDate: adminDate,
      });
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 2000);
    } finally {
      setSavingAdmin(false);
    }
  };

  useEffect(() => {
    if (tab !== 'firmas' || document.status !== 'PENDIENTE') return;
    setupCanvas();
    const onResize = () => {
      setupCanvas();
      setHasSignature(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [tab, document.status]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const strokeWidthFor = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Force Touch / Apple Pencil: pressure 0–1. Trackpad clic normal ≈ 0.5
    const p = e.pressure > 0 ? e.pressure : 0.5;
    return 1.4 + p * 3.2;
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const point = getPos(e);
    lastPointRef.current = point;
    ctx.lineWidth = strokeWidthFor(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    // Punto inicial visible (clic sin arrastrar aún)
    ctx.lineTo(point.x + 0.01, point.y + 0.01);
    ctx.stroke();
    setHasSignature(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPos(e);
    const last = lastPointRef.current;
    ctx.lineWidth = strokeWidthFor(e);
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    else ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    setHasSignature(true);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasSignature(false);
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleSign = () => {
    if (!accepted) {
      setShowError(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    if (isNeuro) {
      void supabaseService.updateConsentAdministration(document.id, {
        administrationNumber: adminNumber.trim(),
        administrationDate: adminDate,
      });
    }
    onSignComplete(document.id, canvas.toDataURL('image/png'));
  };

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await openOrDownloadConsentPdf(document, supabaseService.getClinicSettings());
    } finally {
      setLoadingPdf(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Vista previa' },
    { id: 'datos', label: 'Datos' },
    { id: 'firmas', label: 'Firmas' },
    { id: 'historial', label: 'Historial' },
  ];

  const canSign = document.status === 'PENDIENTE';

  return (
    <div className="max-w-xl mx-auto pb-36 lg:pb-10 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
            {document.title}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
            {document.patientNameSnapshot}
          </p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 flex-1 py-2.5 px-2 rounded-xl text-[11px] font-extrabold ${
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-[#bd003c] dark:text-rose-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          {looksLikeHtml(document.contentSnapshot || '') ? (
            <div
              className="prose-consent text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(document.contentSnapshot || ''),
              }}
            />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {document.contentSnapshot}
            </p>
          )}
        </div>
      )}

      {tab === 'datos' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            {[
              { label: 'Paciente', value: document.patientNameSnapshot },
              { label: 'DNI', value: document.patientDniSnapshot },
              { label: 'Tratamiento', value: document.title },
              { label: 'Categoría', value: document.category },
              { label: 'Versión plantilla', value: `v${document.templateVersion}` },
              {
                label: 'Creado',
                value: new Date(document.createdAt).toLocaleString('es-ES'),
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
          </div>

          {isNeuro && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5 space-y-3">
              <p className="text-sm font-extrabold text-amber-900 dark:text-amber-100">
                Control neuromoduladores
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                Nº de administración y fecha del producto inyectado.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nº de administración
                </label>
                <input
                  type="text"
                  value={adminNumber}
                  onChange={(e) => setAdminNumber(e.target.value)}
                  placeholder="Ej. lote / nº vial"
                  className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm outline-hidden focus:ring-2 focus:ring-[#bd003c]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Fecha de administración
                </label>
                <input
                  type="date"
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm outline-hidden focus:ring-2 focus:ring-[#bd003c]"
                />
              </div>
              <button
                type="button"
                disabled={savingAdmin}
                onClick={saveAdministration}
                className="w-full py-3 rounded-2xl bg-[#373DA2] text-white text-sm font-bold disabled:opacity-50"
              >
                {savingAdmin ? 'Guardando…' : adminSaved ? 'Guardado' : 'Guardar control'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'firmas' && (
        <div className="space-y-4">
          {document.status === 'FIRMADO' && storedSignatureUrl ? (
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs font-bold text-slate-500 mb-2">Firma capturada</p>
              <img
                src={storedSignatureUrl}
                alt="Firma"
                className="w-full max-h-40 object-contain bg-slate-50 rounded-xl"
              />
              {document.signedAt && (
                <p className="text-xs text-slate-500 mt-2">
                  Firmado el {new Date(document.signedAt).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          ) : canSign ? (
            <>
              {isNeuro && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
                  <p className="text-sm font-extrabold text-amber-900 dark:text-amber-100">
                    Neuromoduladores — rellenar antes de firmar
                  </p>
                  <input
                    type="text"
                    value={adminNumber}
                    onChange={(e) => setAdminNumber(e.target.value)}
                    placeholder="Nº de administración"
                    className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm"
                  />
                  <input
                    type="date"
                    value={adminDate}
                    onChange={(e) => setAdminDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={saveAdministration}
                    className="text-xs font-bold text-[#373DA2]"
                  >
                    {adminSaved ? '✓ Guardado' : 'Guardar nº y fecha'}
                  </button>
                </div>
              )}
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Firma</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Trackpad Mac: haz clic y arrastra. Force Touch varía el grosor. También dedo,
                    Pencil o ratón.
                  </p>
                </div>
                <div className="relative w-full">
                  <canvas
                    ref={canvasRef}
                    className="block w-full h-44 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl touch-none cursor-crosshair select-none"
                    style={{ touchAction: 'none' }}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 px-4 text-center">
                        Firma aquí con el trackpad
                      </p>
                    </div>
                  )}
                </div>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="w-full py-3 rounded-xl border-2 border-[#bd003c]/30 text-[#bd003c] font-extrabold text-sm flex items-center justify-center gap-2 bg-rose-50/80 dark:bg-rose-950/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar firma y volver a firmar
                  </button>
                )}
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => {
                    setAccepted(e.target.checked);
                    setShowError(false);
                  }}
                  className="mt-1 accent-[#bd003c]"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  El paciente ha leído y comprende el consentimiento informado.
                </span>
              </label>
              {showError && (
                <p className="text-xs text-[#bd003c] font-bold px-1">
                  Debes confirmar la lectura del documento.
                </p>
              )}
            </>
          ) : (
            <p className="p-6 text-sm text-slate-400 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              Este documento no admite firma en su estado actual.
            </p>
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          <div className="p-4">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Documento creado</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(document.createdAt).toLocaleString('es-ES')}
            </p>
          </div>
          {document.signedAt && (
            <div className="p-4">
              <p className="font-bold text-sm text-slate-900 dark:text-white">Firmado</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(document.signedAt).toLocaleString('es-ES')}
              </p>
            </div>
          )}
          <div className="p-4">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Última actualización</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(document.updatedAt).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 lg:static lg:mt-2 z-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 lg:border-0 lg:bg-transparent p-4 lg:p-0 flex gap-3">
        {document.status === 'FIRMADO' ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={loadingPdf}
              className="flex-[1.4] py-3.5 rounded-2xl bg-[#373DA2] text-white font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {loadingPdf ? 'Abriendo…' : 'Descargar PDF'}
            </button>
          </>
        ) : canSign ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={!hasSignature}
              className="flex-[1.4] py-3.5 rounded-2xl bg-[#bd003c] disabled:opacity-40 text-white font-extrabold text-sm"
            >
              Finalizar y firmar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#373DA2] text-white font-extrabold text-sm"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};
