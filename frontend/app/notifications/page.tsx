'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardContent, Badge, Skeleton, EmptyState, PageHeader } from '../components/ui';
import { Button } from '../components/ui/button';
import {
  Bell, MessageCircle, CheckCircle2, XCircle, Clock,
  RefreshCw, UserPlus, AlertTriangle, CalendarX,
} from 'lucide-react';
import api from '../lib';

interface Notification {
  id: string;
  type: 'WELCOME' | 'EXPIRY_REMINDER' | 'EXPIRED' | 'RENEWED';
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  createdAt: string;
  member: {
    id: string;
    fullName: string;
    memberCode: string;
    phone: string;
  };
}

const typeConfig = {
  WELCOME:         { label: 'ترحيب',          icon: UserPlus,      color: 'text-green-400',  bg: 'bg-green-500/10'  },
  EXPIRY_REMINDER: { label: 'تذكير بالانتهاء',  icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  EXPIRED:         { label: 'منتهي',          icon: CalendarX,     color: 'text-red-400',    bg: 'bg-red-500/10'    },
  RENEWED:         { label: 'تم التجديد',       icon: CheckCircle2,  color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
};

const statusConfig = {
  PENDING: { label: 'قيد الانتظار', color: 'text-yellow-400', icon: Clock },
  SENT:    { label: 'تم الإرسال',    color: 'text-green-400',  icon: CheckCircle2 },
  FAILED:  { label: 'فشل',          color: 'text-red-400',    icon: XCircle },
};

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `منذ ${s} ثانية`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SENT' | 'FAILED'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const data = await api.get<Notification[]>('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setError('فشل في تحميل الإشعارات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = notifications.filter(n => filter === 'ALL' || n.status === filter);

  // Stats
  const totalSent    = notifications.filter(n => n.status === 'SENT').length;
  const totalPending = notifications.filter(n => n.status === 'PENDING').length;
  const totalFailed  = notifications.filter(n => n.status === 'FAILED').length;

  const tabLabels = {
    ALL: `الكل (${notifications.length})`,
    SENT: 'تم الإرسال',
    PENDING: 'قيد الانتظار',
    FAILED: 'فشل',
  };

  return (
    <DashboardShell title="الإشعارات">
      <div className="space-y-6">

        {/* WhatsApp header */}
        <Card className="border-[#27272A] bg-[#18181B] overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-green-500/10 to-transparent border-b border-[#27272A]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">سجل إشعارات واتساب</h2>
                  <p className="text-sm text-zinc-400">
                    الرسائل التلقائية المرسلة للمشتركين للتجديدات والتنبيهات
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#27272A] text-zinc-300 hover:bg-[#27272A]"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#27272A]">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{totalSent}</p>
              <p className="text-xs text-zinc-500 mt-0.5">تم الإرسال</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalPending}</p>
              <p className="text-xs text-zinc-500 mt-0.5">قيد الانتظار</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{totalFailed}</p>
              <p className="text-xs text-zinc-500 mt-0.5">فشلت</p>
            </div>
          </div>
        </Card>

        {/* Filter tabs */}
        <div className="flex border-b border-[#27272A]">
          {(['ALL', 'SENT', 'PENDING', 'FAILED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                filter === tab
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* List */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-[#27272A] animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#27272A] rounded animate-pulse w-48" />
                      <div className="h-3 bg-[#27272A] rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-zinc-400">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#27272A] text-white hover:bg-[#27272A]"
                  onClick={() => fetchNotifications()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={<Bell className="w-12 h-12 text-zinc-500" />}
                  title={filter === 'ALL' ? 'لا توجد إشعارات بعد' : `لا توجد إشعارات بحالة "${tabLabels[filter]}"`}
                  description={
                    filter === 'ALL'
                      ? 'سيظهر سجل الإشعارات والرسائل التلقائية هنا بمجرد إرسالها للأعضاء.'
                      : `لا توجد أي إشعارات مسجلة بحالة "${tabLabels[filter]}".`
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#27272A]">
                {filtered.map((n) => {
                  const tc = typeConfig[n.type];
                  const sc = statusConfig[n.status];
                  const TypeIcon   = tc.icon;
                  const StatusIcon = sc.icon;

                  return (
                    <li key={n.id} className="flex items-start gap-4 p-4 hover:bg-[#1F1F23] transition-colors">
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${tc.bg}`}>
                        <TypeIcon className={`w-5 h-5 ${tc.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{n.member.fullName}</span>
                          <span className="text-xs text-zinc-500 font-mono">{n.member.memberCode}</span>
                          <Badge className={`mr-auto text-xs px-2 py-0.5 ${tc.bg} ${tc.color} border-0`}>
                            {tc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`flex items-center gap-1 text-xs ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          <span className="text-xs text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500">
                            {n.sentAt
                              ? `أُرسلت ${formatRelative(n.sentAt)}`
                              : `أُنشئت ${formatRelative(n.createdAt)}`}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}
