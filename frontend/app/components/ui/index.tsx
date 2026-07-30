'use client';

import React from 'react';
import clsx from 'clsx';

// ===== Card =====
interface CardProps { children: React.ReactNode; className?: string; }
export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-[#18181B] border border-[#27272A] rounded-xl', className)}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx('px-5 py-4 border-b border-[#27272A] flex items-center justify-between', className)}>{children}</div>;
}
export function CardContent({ children, className }: CardProps) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}

// ===== Badge =====
type BadgeVariant = 'success' | 'danger' | 'destructive' | 'warning' | 'info' | 'neutral' | 'primary' | 'secondary' | 'default' | 'outline';
interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; onClick?: () => void; }

const badgeStyles: Record<BadgeVariant, string> = {
  success:     'bg-[#22C55E15] text-[#22C55E] border-[#22C55E30]',
  danger:      'bg-[#EF444415] text-[#EF4444] border-[#EF444430]',
  destructive: 'bg-[#EF444415] text-[#EF4444] border-[#EF444430]',
  warning:     'bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B30]',
  info:        'bg-[#3B82F615] text-[#3B82F6] border-[#3B82F630]',
  neutral:     'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]',
  primary:     'bg-[#F9731615] text-[#F97316] border-[#F9731630]',
  // shadcn/ui alias variants
  secondary:   'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]',
  default:     'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]',
  outline:     'bg-transparent text-[#A1A1AA] border-[#3F3F46]',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      badgeStyles[variant], className
    )}>
      {children}
    </span>
  );
}

// ===== Avatar =====
// Supports both: name+photo AND fallback+src patterns
interface AvatarProps {
  name?: string;
  photo?: string | null;
  fallback?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
const avatarSizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

export function Avatar({ name, photo, fallback, src, size = 'md', className }: AvatarProps) {
  const imgSrc = src || photo;
  const initials = fallback || (name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?');

  if (imgSrc) {
    return (
      <img src={imgSrc} alt={name || ''} className={clsx('rounded-full object-cover border-2 border-[#27272A] flex-shrink-0', avatarSizes[size], className)} />
    );
  }
  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center font-semibold border-2 border-[#27272A] flex-shrink-0',
      'bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white',
      avatarSizes[size], className
    )}>
      {initials}
    </div>
  );
}

// ===== Spinner =====
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-[3px]' }[size];
  return <div className={clsx('rounded-full border-current border-t-transparent animate-spin', s, className)} />;
}

// ===== Skeleton =====
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-shimmer rounded-lg', className)} />;
}

// ===== Empty State =====
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-[#71717A]">{icon}</div>}
      <h3 className="text-base font-semibold text-[#FAFAFA] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#71717A] max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ===== Error State =====
// Supports both: message AND title+description patterns
interface ErrorStateProps {
  message?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
}
export function ErrorState({ message, title, description, onRetry }: ErrorStateProps) {
  const displayTitle = title || 'Error';
  const displayMsg = message || description || 'Something went wrong';
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#EF444415] border border-[#EF444430] flex items-center justify-center mb-4">
        <span className="text-[#EF4444] text-xl font-bold">✗</span>
      </div>
      <p className="text-[#EF4444] font-semibold mb-1">{displayTitle}</p>
      <p className="text-sm text-[#A1A1AA] mb-3">{displayMsg}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-[#F97316] hover:underline">Retry</button>
      )}
    </div>
  );
}

// ===== Stat Card =====
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  className?: string;
}
const statCardStyles: Record<string, string> = {
  default: 'border-[#27272A]',
  primary: 'border-[#F9731630] bg-gradient-to-br from-[#F9731608] to-[#18181B]',
  success: 'border-[#22C55E30] bg-gradient-to-br from-[#22C55E08] to-[#18181B]',
  danger:  'border-[#EF444430] bg-gradient-to-br from-[#EF444408] to-[#18181B]',
  warning: 'border-[#F59E0B30] bg-gradient-to-br from-[#F59E0B08] to-[#18181B]',
};
const statIconStyles: Record<string, string> = {
  default: 'bg-[#27272A] text-[#A1A1AA]',
  primary: 'bg-[#F9731620] text-[#F97316]',
  success: 'bg-[#22C55E20] text-[#22C55E]',
  danger:  'bg-[#EF444420] text-[#EF4444]',
  warning: 'bg-[#F59E0B20] text-[#F59E0B]',
};
export function StatCard({ title, value, icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div className={clsx(
      'bg-[#18181B] border rounded-xl p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-lg',
      statCardStyles[variant], className
    )}>
      {icon && (
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', statIconStyles[variant])}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-[#FAFAFA] leading-none">{value}</p>
        {trend && (
          <p className={clsx('text-xs mt-1.5 font-medium', trend.value >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

// ===== Modal =====
interface ModalProps {
  open?: boolean;
  isOpen?: boolean;        // alias
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void; // shadcn/ui alias
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}
const modalSizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function Modal({ open, isOpen, onClose, onOpenChange, title, children, size = 'md', footer }: ModalProps) {
  const visible = open ?? isOpen ?? false;
  if (!visible) return null;
  const handleClose = () => { onClose?.(); onOpenChange?.(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className={clsx(
        'relative w-full bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl animate-scale-in overflow-hidden',
        modalSizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A]">
          <h2 className="text-base font-semibold text-[#FAFAFA]">{title}</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors">✕</button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#27272A] flex items-center justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ===== Confirm Dialog =====
// Supports both prop naming conventions
interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;           // alias
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void; // shadcn/ui alias
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;       // alias
  confirmLabel?: string;
  confirmText?: string;       // alias
  variant?: 'danger' | 'primary';
  confirmVariant?: 'destructive' | 'danger' | 'primary'; // alias
  loading?: boolean;
  isLoading?: boolean;        // alias
}
export function ConfirmDialog({
  open, isOpen, onClose, onOpenChange, onConfirm, title, message, description,
  confirmLabel, confirmText, variant, confirmVariant, loading, isLoading
}: ConfirmDialogProps) {
  const visible = open ?? isOpen ?? false;
  const msg = message || description || 'Are you sure?';
  const btnLabel = confirmLabel || confirmText || 'Confirm';
  const isDanger = variant === 'danger' || confirmVariant === 'destructive' || confirmVariant === 'danger' || (!variant && !confirmVariant);
  const busy = loading || isLoading;
  const handleClose = () => { onClose?.(); onOpenChange?.(false); };

  return (
    <Modal open={visible} onClose={handleClose} title={title} size="sm">
      <p className="text-sm text-[#A1A1AA] mb-5">{msg}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!!busy}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50',
            isDanger ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#F97316] hover:bg-[#EA580C]'
          )}
        >
          {busy ? '...' : btnLabel}
        </button>
      </div>
    </Modal>
  );
}

// ===== Page Header =====
interface PageHeaderProps { title: string; subtitle?: string; description?: string; action?: React.ReactNode; }
export function PageHeader({ title, subtitle, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#FAFAFA]">{title}</h1>
        {(subtitle || description) && <p className="text-sm text-[#71717A] mt-0.5">{subtitle || description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ===== Divider =====
export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-[#27272A]" />
      {label && <span className="text-xs text-[#71717A]">{label}</span>}
      {label && <div className="flex-1 h-px bg-[#27272A]" />}
    </div>
  );
}
