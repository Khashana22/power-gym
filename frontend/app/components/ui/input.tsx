'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#A1A1AA]">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#71717A] pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full h-10 rounded-lg bg-[#18181B] border text-[#FAFAFA] text-sm placeholder:text-[#52525B]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-0 focus:border-transparent',
              error ? 'border-[#EF4444]' : 'border-[#27272A] hover:border-[#3F3F46]',
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon ? 'pr-10' : 'pr-3',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[#71717A]">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#71717A]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#A1A1AA]">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-lg bg-[#18181B] border text-[#FAFAFA] text-sm placeholder:text-[#52525B] p-3 resize-none',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent',
            error ? 'border-[#EF4444]' : 'border-[#27272A] hover:border-[#3F3F46]',
            className,
          )}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#A1A1AA]">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full h-10 rounded-lg bg-[#18181B] border text-[#FAFAFA] text-sm px-3',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent',
            error ? 'border-[#EF4444]' : 'border-[#27272A] hover:border-[#3F3F46]',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
