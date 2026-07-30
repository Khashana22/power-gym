'use client';

import { Menu, Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
}

export function Topbar({ title, onMenuClick, searchPlaceholder, onSearch }: TopbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="h-14 bg-[#0C0C0E] border-b border-[#27272A] flex items-center gap-3 px-4 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h2 className="text-sm font-semibold text-[#FAFAFA] flex-shrink-0">{title}</h2>

      {/* Search */}
      {onSearch !== undefined && (
        <div className="flex-1 max-w-xs ml-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#52525B] pointer-events-none" />
            <input
              value={searchValue}
              onChange={handleSearch}
              placeholder={searchPlaceholder || 'Search...'}
              className="w-full h-8 pl-9 pr-3 bg-[#18181B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications bell */}
        <Link href="/notifications" className="w-9 h-9 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors relative">
          <Bell className="w-4 h-4" />
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-[#27272A] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="text-xs font-medium text-[#FAFAFA] hidden sm:block max-w-24 truncate">
              {user?.fullName || user?.email}
            </span>
            <ChevronDown className={clsx('w-3 h-3 text-[#71717A] transition-transform hidden sm:block', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-11 w-48 bg-[#18181B] border border-[#27272A] rounded-xl shadow-xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-[#27272A]">
                <p className="text-xs font-medium text-[#FAFAFA] truncate">{user?.fullName || user?.email}</p>
                <p className="text-[10px] text-[#71717A] truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[#F9731615] text-[#F97316] border border-[#F9731630]">
                  {user?.role}
                </span>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#EF444415] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
