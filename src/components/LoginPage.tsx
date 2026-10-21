import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmail } from '../lib/supabaseClient';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError('Email o contraseña incorrectos. Revísalos e inténtalo de nuevo.');
      setLoading(false);
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f7f4f6] text-slate-900 font-[Figtree,system-ui,sans-serif]">
      {/* Brand panel — full width on mobile header, left half on desktop */}
      <aside className="relative overflow-hidden lg:w-[46%] lg:min-h-screen px-6 pt-10 pb-8 lg:px-12 lg:py-16 flex flex-col justify-between bg-gradient-to-br from-[#373DA2] via-[#4a3f8f] to-[#bd003c]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,200,180,0.2), transparent 40%)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -bottom-20 w-72 h-72 rounded-full border border-white/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-4 -bottom-4 w-48 h-48 rounded-full border border-white/10"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10"
        >
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-white/65 mb-3">
            Consentia
          </p>
          <h1 className="font-[Cormorant_Garamond,Georgia,serif] text-[2.65rem] sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
            Dra. Gloria Cabezas
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/85 font-medium max-w-sm leading-snug">
            Gestión de consentimientos informados de su consulta.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative z-10 mt-8 lg:mt-0 space-y-2"
        >
          <p className="text-sm font-semibold text-white/90">Medicina estética</p>
          <p className="text-[11px] text-white/55 font-medium hidden lg:block">
            Acceso restringido · Cifrado RGPD
          </p>
        </motion.div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-16 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="mb-7 lg:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Iniciar sesión
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 font-medium leading-relaxed">
              Introduce el email y la contraseña de la clínica para entrar al panel de Consentia.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[1.75rem] border border-slate-200/90 shadow-[0_20px_50px_-28px_rgba(55,61,162,0.35)] p-6 sm:p-8 space-y-5"
          >
            <div>
              <label htmlFor="login-email" className="text-sm font-semibold text-slate-700 block mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. dra.gloria@clinica.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#bd003c]/35 focus:border-[#bd003c]/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm font-semibold text-slate-700 block mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl pl-10 pr-11 py-3.5 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#bd003c]/35 focus:border-[#bd003c]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium leading-snug"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#bd003c] hover:bg-[#a00033] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-[#bd003c]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar al panel
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Conexión segura · Uso exclusivo de la consulta
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 font-medium lg:hidden">
            Acceso restringido · Cifrado RGPD
          </p>
        </motion.div>
      </main>
    </div>
  );
};
