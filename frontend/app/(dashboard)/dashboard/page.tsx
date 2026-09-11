'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, CreditCard, TrendingUp, Zap,
  UserPlus, DollarSign, ScanLine, RefreshCw,
  Clock, AlertTriangle,
} from 'lucide-react';
import { DashboardShell } from '../../components/dashboard-shell';
import {
  StatCard, Card, CardHeader, CardContent,
  Avatar, Badge, Skeleton, ErrorState,
} from '../../components/ui';
import api from '../../lib';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ChartPoint { date: string; label: string; amount?: number; count?: number; }

interface DashboardStats {
  totalMembers: number;
  newMembersThisMonth: number;
  activeSubscriptions: number;
  expiringSoon7Days: number;
  attendanceToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  recentMembers: {
    id: string; fullName: string; memberCode: string;
    phone: string; photo: string | null; createdAt: string;
  }[];
  expiringSubs: {
    id: string; endDate: string;
    member: { id: string; fullName: string; memberCode: string; phone: string; photo: string | null };
    plan: { name: string };
  }[];
  revenueChart: ChartPoint[];
  attendanceChart: ChartPoint[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function currency(n: number) {
  return `${fmt(n)} ج.م`;
}
function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, isCurrency }: {
  active?: boolean; payload?: { value: number }[]; label?: string; isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 shadow-xl text-right">
      <p className="text-xs text-[#71717A] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#FAFAFA]">
        {isCurrency ? currency(val) : `${fmt(val)} عضو`}
      </p>
    </div>
  );
}

/* ─── Skeleton Loaders ───────────────────────────────────────────────────── */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex items-start gap-4">
          <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <DashboardShell title="لوحة التحكم الرئيسية">
      <div className="space-y-6 max-w-screen-2xl">

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        {loading ? <StatsSkeleton /> : error ? (
          <ErrorState title="تعذر تحميل الإحصائيات" description={error} onRetry={fetchStats} />
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي الأعضاء"
              value={fmt(stats.totalMembers)}
              icon={<Users size={20} />}
              trend={{ value: stats.newMembersThisMonth, label: 'جديد هذا الشهر' }}
              variant="default"
            />
            <StatCard
              title="الاشتراكات السارية"
              value={fmt(stats.activeSubscriptions)}
              icon={<CreditCard size={20} />}
              trend={{ value: -stats.expiringSoon7Days, label: 'تنتهي خلال 7 أيام' }}
              variant="success"
            />
            <StatCard
              title="إيرادات اليوم"
              value={currency(stats.revenueToday)}
              icon={<TrendingUp size={20} />}
              trend={{ value: 0, label: `${currency(stats.revenueThisMonth)} هذا الشهر` }}
              variant="primary"
            />
            <Link href="/attendance" className="block">
              <StatCard
                title="حضور اليوم"
                value={fmt(stats.attendanceToday)}
                icon={<Zap size={20} />}
                variant="warning"
              />
            </Link>
          </div>
        )}

        {/* ── Charts Row ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#FAFAFA]">الإيرادات (آخر 7 أيام)</p>
                  <p className="text-xs text-[#71717A] mt-0.5">إجمالي التحصيل اليومي بالجنيه المصري</p>
                </div>
                <TrendingUp size={16} className="text-[#F97316]" />
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.revenueChart} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#71717A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#71717A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)} ألف`}
                      width={42}
                    />
                    <Tooltip content={<ChartTooltip isCurrency />} cursor={{ fill: '#F9731610' }} />
                    <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attendance Chart */}
            <Card>
              <CardHeader>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#FAFAFA]">حضور الأعضاء (آخر 7 أيام)</p>
                  <p className="text-xs text-[#71717A] mt-0.5">عدد مرات الدخول اليومية</p>
                </div>
                <Users size={16} className="text-[#22C55E]" />
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.attendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#71717A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#71717A', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22C55E"
                      strokeWidth={2.5}
                      dot={{ fill: '#22C55E', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#22C55E' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Quick Actions + Activity Row ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-right">

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold text-[#FAFAFA]">إجراءات سريعة</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <QuickAction
                href="/members/new"
                icon={<UserPlus size={18} />}
                label="إضافة عضو جديد"
                description="تسجيل مشترك جديد وإصدار كود"
                color="primary"
              />
              <QuickAction
                href="/payments"
                icon={<DollarSign size={18} />}
                label="تسجيل دفعة مالية"
                description="تحصيل اشتراك نقدي أو إلكتروني"
                color="success"
              />
              <QuickAction
                href="/attendance"
                icon={<ScanLine size={18} />}
                label="تسجيل الحضور بالباركود"
                description="فحص كود QR وتسجيل الدخول"
                color="info"
              />
              <QuickAction
                href="/subscriptions"
                icon={<CreditCard size={18} />}
                label="إدارة وتجديد الاشتراكات"
                description="تجديد أو إسناد خطة جديدة لعضو"
                color="warning"
              />
            </CardContent>
          </Card>

          {/* Recent Members */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <p className="text-sm font-semibold text-[#FAFAFA]">أحدث الأعضاء المسجلين</p>
              <Link href="/members" className="text-xs text-[#F97316] hover:underline">عرض الكل</Link>
            </CardHeader>
            {loading ? (
              <ListSkeleton rows={5} />
            ) : !stats?.recentMembers?.length ? (
              <CardContent>
                <p className="text-sm text-[#71717A] py-6 text-center">لا يوجد أعضاء مسجلين بعد</p>
              </CardContent>
            ) : (
              <ul className="divide-y divide-[#27272A]">
                {stats.recentMembers.map((m) => (
                  <li key={m.id}>
                    <Link href={`/members/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#1F1F23] transition-colors">
                      <Avatar name={m.fullName} photo={m.photo} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#FAFAFA] truncate">{m.fullName}</p>
                        <p className="text-xs text-[#71717A]">{m.memberCode}</p>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        {new Date(m.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Expiring Subscriptions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#F59E0B]" />
                <p className="text-sm font-semibold text-[#FAFAFA]">اشتراكات تنتهي قريباً</p>
              </div>
              <Link href="/subscriptions" className="text-xs text-[#F97316] hover:underline">عرض الكل</Link>
            </CardHeader>
            {loading ? (
              <ListSkeleton rows={5} />
            ) : !stats?.expiringSubs?.length ? (
              <CardContent>
                <p className="text-sm text-[#71717A] py-6 text-center">لا توجد اشتراكات تنتهي قريباً 🎉</p>
              </CardContent>
            ) : (
              <ul className="divide-y divide-[#27272A]">
                {stats.expiringSubs.map((sub) => {
                  const days = daysLeft(sub.endDate);
                  const urgent = days <= 3;
                  return (
                    <li key={sub.id}>
                      <Link href={`/members/${sub.member.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#1F1F23] transition-colors">
                        <Avatar name={sub.member.fullName} photo={sub.member.photo} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#FAFAFA] truncate">{sub.member.fullName}</p>
                          <p className="text-xs text-[#71717A] truncate">{sub.plan.name}</p>
                        </div>
                        <Badge variant={urgent ? 'danger' : 'warning'} className="text-[10px] whitespace-nowrap">
                          {days === 0 ? 'اليوم' : days === 1 ? 'غداً' : `خلال ${days} أيام`}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Footer Refresh ────────────────────────────────────────── */}
        <div className="flex justify-start pt-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            تحديث البيانات
          </button>
        </div>

      </div>
    </DashboardShell>
  );
}

/* ─── Quick Action Button ────────────────────────────────────────────────── */
const colorMap = {
  primary: { icon: 'bg-[#F9731620] text-[#F97316]', hover: 'hover:border-[#F9731640]' },
  success: { icon: 'bg-[#22C55E20] text-[#22C55E]', hover: 'hover:border-[#22C55E40]' },
  info:    { icon: 'bg-[#3B82F620] text-[#3B82F6]', hover: 'hover:border-[#3B82F640]' },
  warning: { icon: 'bg-[#F59E0B20] text-[#F59E0B]', hover: 'hover:border-[#F59E0B40]' },
};

function QuickAction({ href, icon, label, description, color }: {
  href: string; icon: React.ReactNode; label: string; description: string;
  color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg border border-[#27272A] ${c.hover} hover:bg-[#1F1F23] transition-all duration-150 group`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#FAFAFA] leading-tight">{label}</p>
        <p className="text-xs text-[#71717A] truncate">{description}</p>
      </div>
      <Clock size={12} className="text-[#3F3F46] mr-auto flex-shrink-0 group-hover:text-[#71717A] transition-colors" />
    </Link>
  );
}
