'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Spinner } from './ui';

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
}

export function DashboardShell({ children, title, searchPlaceholder, onSearch }: DashboardShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <span className="text-2xl">💪</span>
          </div>
          <Spinner size="md" className="text-[#F97316]" />
          <p className="text-sm text-[#71717A]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#09090B] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
