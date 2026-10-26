import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  signInWithEmail,
  resetPasswordForEmail,
  getRememberedEmail,
  setRememberedEmail,
} from '../lib/supabaseClient';
import { getAppVersionLabel } from '../appVersion';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

type Mode = 'login' | 'recover';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const remembered = getRememberedEmail();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!remembered);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError('Email o contraseña incorrectos. Revísalos e inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    setRememberedEmail(rememberMe ? email : null);
    onLoginSuccess();
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Introduce el email de la cuenta.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await resetPasswordForEmail(email);
    setLoading(false);
    if (resetError) {
      setError(
        resetError.message ||
          'No se pudo enviar el email. Comprueba el correo o la configuración de Auth en Supabase.'
      );
      return;
    }
    setInfo(
      'Si el email existe, recibirás un enlace para restablecer la contraseña. Revisa también spam.'
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f7f4f6] text-slate-900 font-[Figtree,system-ui,sans-serif]">
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
          <p className="text-[11px] text-white/55 font-medium">
            Acceso restringido · Cifrado RGPD
          </p>
          <p className="text-[10px] text-white/45 font-medium tracking-wide">
            {getAppVersionLabel()}
          </p>
        </motion.div>
      </aside>

      <main className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-16 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="mb-7 lg:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 font-medium leading-relaxed">
              {mode === 'login'
                ? 'Introduce el email y la contraseña de la clínica para entrar al panel de Consentia.'
                : 'Te enviaremos un enlace al email para elegir una nueva contraseña.'}
            </p>
          </div>

          <form
            onSubmit={mode === 'login' ? handleLogin : handleRecover}
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

            {mode === 'login' && (
              <>
                <div>
                  <label
                    htmlFor="login-password"
                    className="text-sm font-semibold text-slate-700 block mb-2"
                  >
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

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#bd003c] w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-600">Recordarme</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover');
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-sm font-bold text-[#373DA2] hover:text-[#bd003c]"
                  >
                    ¿Olvidaste la contraseña?
                  </button>
                </div>
              </>
            )}

            {error && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium leading-snug"
              >
                {error}
              </div>
            )}
            {info && (
              <div
                role="status"
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium leading-snug"
              >
                {info}
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
                  {mode === 'login' ? 'Entrando…' : 'Enviando…'}
                </>
              ) : mode === 'login' ? (
                <>
                  Entrar al panel
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Enviar enlace
                </>
              )}
            </button>

            {mode === 'recover' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfo(null);
                }}
                className="w-full text-sm font-bold text-slate-600 hover:text-[#bd003c]"
              >
                Volver al login
              </button>
            )}

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Conexión segura · Uso exclusivo de la consulta
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            {getAppVersionLabel()}
          </p>
        </motion.div>
      </main>
    </div>
  );
};
