'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard, Users, CreditCard, Package, DollarSign,
  QrCode, BarChart2, Settings, LogOut, Dumbbell, X, Receipt,
  Calendar, Bell, ChevronRight, Shield, Database
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/members',       label: 'Members',       icon: Users },
  { href: '/plans',         label: 'Plans',         icon: Package },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/payments',      label: 'Payments',      icon: DollarSign },
  { href: '/attendance',    label: 'Attendance',    icon: QrCode },
  { href: '/expenses',      label: 'Expenses',      icon: Receipt },
  { href: '/reports',       label: 'Reports',       icon: BarChart2 },
  { href: '/calendar',      label: 'Calendar',      icon: Calendar },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings',      label: 'Settings',      icon: Settings },
];

const ownerNavItems = [
  { href: '/audit-logs', label: 'Audit Logs',  icon: Shield },
  { href: '/snapshots',  label: 'DB Snapshots', icon: Database },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#27272A]">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#FAFAFA] tracking-wide">POWER GYM</h1>
          <p className="text-[10px] text-[#71717A] truncate">Management System</p>
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden text-[#71717A] hover:text-[#FAFAFA] p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive(href)
                ? 'bg-[#F9731615] text-[#F97316] border border-[#F9731630]'
                : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A]'
            )}
          >
            <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive(href) ? 'text-[#F97316]' : 'text-[#52525B] group-hover:text-[#A1A1AA]')} />
            {label}
            {isActive(href) && <ChevronRight className="w-3 h-3 ml-auto text-[#F97316]" />}
          </Link>
        ))}

        {/* Owner-only section */}
        {user?.role === 'OWNER' && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-semibold text-[#3F3F46] uppercase tracking-widest">Admin</p>
            </div>
            {ownerNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive(href)
                    ? 'bg-[#F9731615] text-[#F97316] border border-[#F9731630]'
                    : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A]'
                )}
              >
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive(href) ? 'text-[#F97316]' : 'text-[#52525B] group-hover:text-[#A1A1AA]')} />
                {label}
                {isActive(href) && <ChevronRight className="w-3 h-3 ml-auto text-[#F97316]" />}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User & Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-[#27272A] space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#FAFAFA] truncate">{user.fullName || user.email}</p>
              <p className="text-[10px] text-[#71717A] truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF444415] transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-[#0C0C0E] border-r border-[#27272A] z-50 transition-transform duration-300 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0C0C0E] border-r border-[#27272A] h-full flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
