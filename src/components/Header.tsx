import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  onOpenNotifications,
  unreadCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#373DA2] text-white border-b border-white/15 px-5 py-3.5 shadow-md transition-colors">
      <div className="flex items-center justify-between max-w-lg lg:max-w-full mx-auto">
        {/* Left Action / Back Button (Only rendered if showBack is true) */}
        <div className="flex items-center gap-3 w-9">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Center Brand Title */}
        <div className="text-center">
          <h1 className="font-extrabold tracking-wider text-base text-white uppercase leading-none">
            CONSENTIA
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-blue-200 uppercase mt-0.5">
            DRA. GLORIA CABEZAS
          </p>
        </div>

        {/* Right Notification Bell */}
        <div className="relative flex justify-end w-9">
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-all relative active:scale-95"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#bd003c] text-[10px] font-bold text-white ring-2 ring-[#373DA2] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
