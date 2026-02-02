'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  headerRight?: ReactNode;
}

export function Card({ children, className = '', title, headerRight }: CardProps) {
  return (
    <div
      className={`
        bg-white/5
        backdrop-blur
        rounded-2xl
        p-6
        border border-white/10
        ${className}
      `}
    >
      {(title || headerRight) && (
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
          {title && <h2 className="text-[#81d4fa] text-lg font-semibold">{title}</h2>}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
