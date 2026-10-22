import React from 'react';
import { DocumentStatus } from '../types';

const STYLES: Record<DocumentStatus, string> = {
  FIRMADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
  PENDIENTE: 'bg-orange-500 text-white',
  BORRADOR: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
  RECHAZADO: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export const StatusBadge: React.FC<{ status: DocumentStatus; className?: string }> = ({
  status,
  className = '',
}) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase ${STYLES[status]} ${className}`}
  >
    {status}
  </span>
);
