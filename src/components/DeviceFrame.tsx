import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Moon, Sun, Zap, Wifi } from 'lucide-react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceFrameProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSimulatePush: () => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  darkMode,
  onToggleDarkMode,
  onSimulatePush,
}) => {
  const [device, setDevice] = useState<DeviceType>('mobile');

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-[#050505] text-slate-900 dark:text-[#E0E0E0] transition-colors flex flex-col items-center relative overflow-x-hidden">
      {/* Atmospheric Background Glows (Visible in dark mode or subtle accent in light mode) */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-500/10 dark:bg-blue-600/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-[40%] left-[30%] w-[400px] h-[400px] bg-amber-500/10 dark:bg-rose-600/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Top Device Bar & Quick Controls */}
      <div className="w-full bg-white/90 dark:bg-[#080808]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-800 dark:text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-40 shadow-sm dark:shadow-lg transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 dark:from-rose-400 dark:via-rose-300 dark:to-amber-200 uppercase">
            Consentia Vitality
          </span>
          <span className="hidden sm:inline-block text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Supabase Live Sync
          </span>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg transition-all ${
              device === 'mobile' ? 'bg-[#bd003c] text-white shadow-md shadow-rose-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Móvil (iOS/Android)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg transition-all ${
              device === 'tablet' ? 'bg-[#bd003c] text-white shadow-md shadow-rose-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition-all ${
              device === 'desktop' ? 'bg-[#bd003c] text-white shadow-md shadow-rose-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Completa / Web"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSimulatePush}
            className="hidden xs:flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-gradient-to-r dark:from-rose-950/80 dark:to-amber-950/80 hover:bg-rose-100 dark:hover:from-rose-900 dark:hover:to-amber-900 text-[#bd003c] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-[11px] font-bold transition-all shadow-xs"
          >
            <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-pulse" />
            Prob. Push
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
            title="Cambiar Modo Oscuro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="w-full flex-1 flex justify-center py-0 sm:py-6 px-0 sm:px-4 z-10">
        {device === 'mobile' ? (
          <div className="w-full max-w-[420px] bg-[#f8f9fa] dark:bg-[#07090e]/95 backdrop-blur-2xl sm:rounded-[40px] shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-0 sm:border border-slate-300 dark:border-white/10 overflow-hidden relative flex flex-col min-h-[840px] transition-all">
            {/* Phone Speaker/Camera Notch (Visible on sm screens) */}
            <div className="hidden sm:flex justify-center pt-2.5 bg-slate-200 dark:bg-[#07090e]">
              <div className="w-28 h-4 bg-slate-900 dark:bg-black/80 border border-slate-700 dark:border-white/10 rounded-full flex items-center justify-end px-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-3">{children}</div>
          </div>
        ) : device === 'tablet' ? (
          <div className="w-full max-w-[768px] bg-[#f8f9fa] dark:bg-[#07090e]/95 backdrop-blur-2xl rounded-[32px] shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-300 dark:border-white/10 overflow-hidden min-h-[800px] flex flex-col p-6 transition-all">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-[#f8f9fa] dark:bg-[#07090e]/95 backdrop-blur-2xl rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-300 dark:border-white/10 p-8 min-h-[800px] flex flex-col transition-all">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};
