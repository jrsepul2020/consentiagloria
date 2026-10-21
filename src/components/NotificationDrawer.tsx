import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BellRing, Zap, CheckCircle2, UserPlus, FileSignature, Info, Trash2 } from 'lucide-react';
import { PushNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSimulatePush: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSimulatePush,
}) => {
  const getIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'signature':
        return <FileSignature className="w-5 h-5 text-[#bd003c] dark:text-rose-400" />;
      case 'new_client':
        return <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-[#bd003c] dark:text-rose-400">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    Notificaciones Push
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sincronización Supabase Realtime
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-5 py-3 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100/50 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={onSimulatePush}
                className="flex-1 py-2 px-3 bg-[#bd003c] hover:bg-[#a00033] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Simular Firma Realtime
              </button>

              <button
                onClick={onMarkAllRead}
                className="py-2 px-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Leer todas
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BellRing className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-sm">No tienes notificaciones pendientes</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Las firmas y registros aparecerán aquí al instante
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => onMarkRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900/50 shadow-xs text-slate-900 dark:text-slate-100 ring-1 ring-rose-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900">
              Notificaciones activas en iOS, Android y Web App
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
