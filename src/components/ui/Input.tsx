'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-[#aaa]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            px-3.5 py-2.5
            bg-white/10
            border border-white/20
            rounded-lg
            text-white
            placeholder-[#666]
            focus:outline-none focus:border-[#4fc3f7]
            transition-colors
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
