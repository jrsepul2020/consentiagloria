import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface HeaderProps {
  /** Título de contexto de la pantalla (escritorio). En móvil se usa la marca. */
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  onOpenNotifications,
  unreadCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#373DA2] text-white border-b border-white/15 px-4 sm:px-5 py-3 shadow-md">
      <div className="flex items-center justify-between max-w-lg lg:max-w-full mx-auto gap-3">
        <div className="flex items-center gap-2 w-10 shrink-0">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Móvil: una sola marca. Escritorio: título de sección (la marca ya está en el sidebar). */}
        <div className="flex-1 text-center min-w-0">
          <h1 className="lg:hidden font-[Cormorant_Garamond,Georgia,serif] text-xl font-semibold tracking-tight text-white leading-none">
            Consentia
          </h1>
          <p className="lg:hidden text-[10px] font-semibold tracking-[0.14em] text-white/70 uppercase mt-1 truncate">
            Dra. Gloria Cabezas
          </p>
          <p className="hidden lg:block text-sm font-bold text-white/95 truncate">
            {title || 'Panel'}
          </p>
        </div>

        <div className="relative flex justify-end w-10 shrink-0">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-all relative active:scale-95"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#bd003c] text-[10px] font-bold text-white ring-2 ring-[#373DA2]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
