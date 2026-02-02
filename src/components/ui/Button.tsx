'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6] text-[#1a1a2e]',
  secondary: 'bg-gradient-to-r from-[#78909c] to-[#546e7a] text-white',
  danger: 'bg-gradient-to-r from-[#ef5350] to-[#e53935] text-white',
  success: 'bg-gradient-to-r from-[#66bb6a] to-[#43a047] text-white',
  ghost: 'bg-transparent text-[#888] hover:bg-white/10 hover:text-white',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          font-semibold rounded-lg transition-all
          hover:transform hover:-translate-y-0.5 hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
