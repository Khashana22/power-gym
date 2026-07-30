'use client';

import { DashboardShell } from '../components/dashboard-shell';

// This layout wraps all (dashboard) routes.
// DashboardShell handles auth check + redirect + sidebar + topbar.
// Each page can pass its own title via the slot mechanism by using
// DashboardShell directly for full control, or this bare layout for
// simple full-page routes.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Pages that need their own DashboardShell (with title) wrap themselves.
  // This layout just renders children; the individual page uses DashboardShell.
  return <>{children}</>;
}
