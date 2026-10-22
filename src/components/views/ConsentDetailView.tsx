import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { Consent } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { openOrDownloadConsentPdf } from '../../utils/pdfGenerator';
import { supabaseService } from '../../services/supabaseService';
import { getStorageSignedUrl } from '../../lib/consentStorage';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [storedSignatureUrl, setStoredSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    setAccepted(false);
    setShowError(false);
    setHasSignature(false);
    setTab(document.status === 'PENDIENTE' ? 'firmas' : 'preview');
    setStoredSignatureUrl(null);

    if (document.signaturePath) {
      void getStorageSignedUrl('consent-signatures', document.signaturePath).then((url) => {
        if (url) setStoredSignatureUrl(url);
      });
    } else if (document.signatureData?.startsWith('data:image')) {
      setStoredSignatureUrl(document.signatureData);
    }
  }, [document.id, document.status, document.signaturePath, document.signatureData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#bd003c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [tab]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!accepted) {
      setShowError(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
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
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {document.contentSnapshot}
          </p>
        </div>
      )}

      {tab === 'datos' && (
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
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Firma</p>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs font-bold text-[#bd003c] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={160}
                  className="w-full h-40 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
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
