'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ShowToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
}

// Flexible toast options — supports both our internal API and shadcn-compatible API
interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  // shadcn/ui aliases used by pre-existing pages:
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

interface ToastContextValue {
  // Primary API (used internally and by newer pages)
  toast: (opts: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  // Legacy API (showToast pattern used by subagent-generated pages)
  showToast: (opts: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const typeStyles: Record<ToastType, string> = {
  success: 'border-[#22C55E]/30',
  error:   'border-[#EF4444]/30',
  warning: 'border-[#F59E0B]/30',
  info:    'border-[#3B82F6]/30',
};

const typeIconStyles: Record<ToastType, string> = {
  success: 'text-[#22C55E]',
  error:   'text-[#EF4444]',
  warning: 'text-[#F59E0B]',
  info:    'text-[#3B82F6]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]); // keep max 5
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toast = useCallback(({ type, title, message, description, variant }: ToastOptions) => {
    // Resolve aliases: description -> message, variant:'destructive' -> 'error'
    const resolvedMsg = message ?? description;
    let resolvedType: ToastType = type ?? 'info';
    if (variant === 'destructive') resolvedType = 'error';
    else if (variant === 'success') resolvedType = 'success';
    else if (variant === 'warning') resolvedType = 'warning';
    else if (variant === 'info') resolvedType = 'info';
    addToast(resolvedType, title, resolvedMsg);
  }, [addToast]);

  const showToast = useCallback(({ title, message, type = 'info' }: ShowToastOptions) => {
    addToast(type, title, message);
  }, [addToast]);

  const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast]);
  const error   = useCallback((title: string, message?: string) => addToast('error', title, message),   [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast('warning', title, message), [addToast]);
  const info    = useCallback((title: string, message?: string) => addToast('info', title, message),    [addToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-[#18181B]/95 border rounded-xl p-4 shadow-xl animate-fade-in backdrop-blur-sm ${typeStyles[t.type]}`}
          >
            <span className={`text-base mt-0.5 font-bold flex-shrink-0 ${typeIconStyles[t.type]}`}>
              {typeIcons[t.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#FAFAFA] leading-snug">{t.title}</p>
              {t.message && <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[#71717A] hover:text-[#FAFAFA] transition-colors text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Dummy export so layout.tsx can import { Toaster } - not needed since ToastProvider renders toasts inline
export function Toaster() { return null; }

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op fallback when used outside provider
    const noop = () => {};
    return { toast: noop, showToast: noop, success: noop, error: noop, warning: noop, info: noop };
  }
  return ctx;
}
