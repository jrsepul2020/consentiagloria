import React from 'react';
import { Home, Users, FileCheck, LayoutTemplate, Settings, Moon, Sun, Zap, ShieldCheck, LogOut } from 'lucide-react';

export type NavTab = 'inicio' | 'clientes' | 'consentimientos' | 'plantillas' | 'ajustes';

interface SidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  pendingCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSimulatePush: () => void;
  userEmail?: string;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  pendingCount,
  darkMode,
  onToggleDarkMode,
  onSimulatePush,
  userEmail,
  onSignOut,
}) => {
  const navItems = [
    { id: 'inicio' as NavTab, label: 'Inicio', icon: Home },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: Users },
    {
      id: 'consentimientos' as NavTab,
      label: 'Consentimientos',
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'plantillas' as NavTab, label: 'Plantillas', icon: LayoutTemplate },
    { id: 'ajustes' as NavTab, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 h-screen transition-colors">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <h1 className="font-extrabold tracking-wider text-lg bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 dark:from-rose-400 dark:via-rose-300 dark:to-amber-200 uppercase">
            Consentia
          </h1>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 tracking-wide uppercase">
          Gestión de Consentimientos
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                isActive
                  ? 'bg-[#bd003c]/10 dark:bg-rose-950/40 text-[#bd003c] dark:text-rose-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#bd003c] dark:bg-rose-400 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#bd003c] dark:text-rose-400' : ''}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Simulate Push */}
        <button
          onClick={onSimulatePush}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-[#bd003c] dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-bold transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
          Probar Push Realtime
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </button>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-[#bd003c] dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Cerrar sesión</span>
        </button>

        {userEmail && (
          <p className="px-3 text-[10px] text-slate-400 dark:text-slate-500 truncate" title={userEmail}>
            {userEmail}
          </p>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cifrado RGPD · Supabase Cloud</span>
        </div>
      </div>
    </aside>
  );
};
