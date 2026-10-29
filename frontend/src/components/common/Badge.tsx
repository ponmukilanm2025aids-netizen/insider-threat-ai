import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'dosha' | 'role' | 'stock' | 'payment';
  status?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'status',
  status,
  size = 'md',
}) => {
  const text = (status || (typeof children === 'string' ? children : '')).toLowerCase();

  let colorClasses = 'bg-[#FAF7EF] text-[#40372D] border-[#E5DFD3]';

  if (variant === 'status') {
    if (text.includes('confirmed') || text.includes('active')) {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (text.includes('scheduled')) {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (text.includes('in progress') || text.includes('in treatment')) {
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    } else if (text.includes('completed') || text.includes('discharged')) {
      colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
    } else if (text.includes('cancelled') || text.includes('no-show')) {
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    }
  } else if (variant === 'dosha') {
    if (text.includes('vata')) {
      colorClasses = 'bg-indigo-50 text-indigo-900 border-indigo-200'; // Airy / Ether
    } else if (text.includes('pitta')) {
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-300'; // Fire / Transformative
    } else if (text.includes('kapha')) {
      colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300'; // Earth / Water
    } else {
      colorClasses = 'bg-stone-100 text-stone-800 border-stone-300';
    }
  } else if (variant === 'payment') {
    if (text === 'paid') {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (text === 'pending') {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (text === 'partial') {
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-200';
    }
  } else if (variant === 'role') {
    if (text === 'admin') {
      colorClasses = 'bg-[#244C3A] text-white border-[#244C3A]';
    } else if (text === 'doctor') {
      colorClasses = 'bg-[#B99756] text-white border-[#B99756]';
    } else if (text === 'therapist') {
      colorClasses = 'bg-[#66856A] text-white border-[#66856A]';
    } else {
      colorClasses = 'bg-stone-200 text-stone-800 border-stone-300';
    }
  } else if (variant === 'stock') {
    if (text.includes('low') || text.includes('near')) {
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (text.includes('expired')) {
      colorClasses = 'bg-red-100 text-red-900 border-red-300';
    } else {
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};
