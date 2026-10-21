import React from 'react';
import { Home, Users, FileCheck, LayoutTemplate, Settings } from 'lucide-react';
import { NavTab } from './Sidebar';

export type { NavTab };

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingCount = 0,
}) => {
  const navItems = [
    { id: 'inicio' as NavTab, label: 'Inicio', icon: Home },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: Users },
    {
      id: 'consentimientos' as NavTab,
      label: 'Consent.',
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'plantillas' as NavTab, label: 'Plantillas', icon: LayoutTemplate },
    { id: 'ajustes' as NavTab, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-1 py-1.5 transition-colors lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-[#bd003c] dark:text-rose-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-slate-900">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-medium mt-1 leading-none truncate max-w-[60px]">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#bd003c] dark:bg-rose-400 rounded-full mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
