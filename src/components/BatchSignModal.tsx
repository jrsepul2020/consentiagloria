import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Consent } from '../types';

interface BatchSignModalProps {
  consents: Consent[];
  onCancel: () => void;
  onConfirm: (signatureDataUrl: string) => void;
}

/**
 * Una firma del paciente aplicada a varios consentimientos de la misma sesión.
 * Lista explícitamente todos los tratamientos cubiertos por esa firma.
 */
export const BatchSignModal: React.FC<BatchSignModalProps> = ({
  consents,
  onCancel,
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const cssWidth = parent.clientWidth || 320;
    const cssHeight = 160;
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
    setupCanvas();
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
    const p = getPos(e);
    lastPointRef.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
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
    const p = getPos(e);
    const last = lastPointRef.current;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    setHasSignature(true);
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!accepted) {
      setShowError(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  const patientName = consents[0]?.patientNameSnapshot || 'Paciente';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Firma de sesión
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{patientName}</p>
          </div>
          <button type="button" onClick={onCancel} className="p-2 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Tratamientos cubiertos por esta firma ({consents.length})
            </p>
            <ul className="space-y-1.5">
              {consents.map((c) => (
                <li
                  key={c.id}
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex gap-2"
                >
                  <span className="text-[#bd003c]">•</span>
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              El paciente firma una sola vez en esta sesión. La misma firma se aplica a cada
              consentimiento listado. Cada documento PDF conserva el texto de su tratamiento.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Firma</p>
            <div className="relative w-full">
              <canvas
                ref={canvasRef}
                className="block w-full h-40 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl touch-none cursor-crosshair"
                style={{ touchAction: 'none' }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
              />
              {!hasSignature && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-slate-400">Firme aquí (trackpad, dedo o ratón)</p>
                </div>
              )}
            </div>
            {hasSignature && (
              <button
                type="button"
                onClick={clearCanvas}
                className="w-full mt-2 py-3 rounded-xl border-2 border-[#bd003c]/30 text-[#bd003c] font-extrabold text-sm flex items-center justify-center gap-2 bg-rose-50/80 dark:bg-rose-950/30"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar firma y volver a firmar
              </button>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
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
              El paciente ha leído y comprende todos los consentimientos listados y firma en esta
              sesión para todos ellos.
            </span>
          </label>
          {showError && (
            <p className="text-xs font-bold text-[#bd003c]">Debe confirmar la lectura.</p>
          )}

          <button
            type="button"
            disabled={!hasSignature}
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-[#bd003c] text-white font-extrabold text-sm disabled:opacity-40"
          >
            Firmar {consents.length} consentimiento{consents.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
};
