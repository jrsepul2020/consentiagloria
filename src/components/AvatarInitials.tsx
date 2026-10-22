import React from 'react';
import { getInitials } from '../utils/nameFormat';

const PALETTE = [
  'bg-[#373DA2] text-white',
  'bg-[#bd003c] text-white',
  'bg-emerald-600 text-white',
  'bg-amber-500 text-white',
  'bg-sky-600 text-white',
  'bg-violet-600 text-white',
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarInitialsProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClass = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-11 h-11 text-xs',
  lg: 'w-14 h-14 text-sm',
  xl: 'w-20 h-20 text-xl',
};

export const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  name,
  size = 'md',
  className = '',
}) => (
  <div
    className={`${sizeClass[size]} ${colorForName(name)} rounded-full flex items-center justify-center font-extrabold shrink-0 ${className}`}
    aria-hidden
  >
    {getInitials(name)}
  </div>
);
