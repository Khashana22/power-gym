'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[#09090B] disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0';

const variants: Record<Variant, string> = {
  primary:     'bg-[#F97316] text-white hover:bg-[#EA580C] active:scale-95 shadow-md hover:shadow-[0_0_20px_rgba(249,115,22,0.25)]',
  secondary:   'bg-[#27272A] text-[#FAFAFA] hover:bg-[#3F3F46] active:scale-95',
  ghost:       'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] active:scale-95',
  danger:      'bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-95',
  destructive: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-95',
  outline:     'border border-[#27272A] text-[#FAFAFA] hover:border-[#F97316] hover:text-[#F97316] active:scale-95 bg-transparent',
};

const sizes: Record<Size, string> = {
  sm:   'h-8 px-3 text-xs',
  md:   'h-10 px-4 text-sm',
  lg:   'h-12 px-6 text-base',
  icon: 'h-8 w-8 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
