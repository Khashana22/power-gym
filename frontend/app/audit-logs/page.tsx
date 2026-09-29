'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import {
  Card,
  CardHeader,
  CardContent,
  PageHeader,
  Badge,
  EmptyState,
  Skeleton,
} from '../components/ui';
import { Button } from '../components/ui/button';
import { Input, Select } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import {
  Shield,
  Activity,
  UserCheck,
  RefreshCw,
  Search,
  Filter,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import api from '../lib';
import { useAuth } from '../lib/auth-context';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface AuditStats {
  total: number;
  recent: number;
  byAction: { action: string; _count: number }[];
  byEntity: { entity: string; _count: number }[];
}

const ACTION_LABELS: Record<string, { label: string; variant: 'success' | 'info' | 'danger' | 'warning' | 'primary' | 'neutral' }> = {
  CREATE:   { label: 'إنشاء',        variant: 'success' },
  UPDATE:   { label: 'تعديل',        variant: 'info' },
  DELETE:   { label: 'حذف',          variant: 'danger' },
  ARCHIVE:  { label: 'أرشفة',        variant: 'warning' },
  RESTORE:  { label: 'استعادة',      variant: 'success' },
  FREEZE:   { label: 'تجميد',        variant: 'warning' },
  UNFREEZE: { label: 'إلغاء تجميد',   variant: 'info' },
  LOGIN:    { label: 'تسجيل دخول',   variant: 'primary' },
  LOGOUT:   { label: 'تسجيل خروج',   variant: 'neutral' },
  EXPORT:   { label: 'تصدير بيانات', variant: 'primary' },
  IMPORT:   { label: 'استيراد',      variant: 'info' },
};

const ENTITY_LABELS: Record<string, string> = {
  Member: 'عضو',
  Subscription: 'اشتراك',
  Payment: 'دفعة مالية',
  MembershipPlan: 'باقة اشتراك',
  Attendance: 'حضور',
  Expense: 'مصروفات',
  ItemSale: 'مبيعات منتجات',
  User: 'مستخدم',
  Gym: 'بيانات الجيم',
};

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'جميع الإجراءات (كل العمليات)' },
  { value: 'CREATE', label: 'إنشاء (CREATE)' },
  { value: 'UPDATE', label: 'تعديل (UPDATE)' },
  { value: 'DELETE', label: 'حذف (DELETE)' },
  { value: 'ARCHIVE', label: 'أرشفة (ARCHIVE)' },
  { value: 'LOGIN', label: 'تسجيل دخول (LOGIN)' },
  { value: 'FREEZE', label: 'تجميد اشتراك (FREEZE)' },
  { value: 'EXPORT', label: 'تصدير بيانات (EXPORT)' },
];

const ENTITY_OPTIONS = [
  { value: 'ALL', label: 'جميع الأقسام (الكل)' },
  { value: 'Member', label: 'الأعضاء (Member)' },
  { value: 'Subscription', label: 'الاشتراكات (Subscription)' },
  { value: 'Payment', label: 'المدفوعات (Payment)' },
  { value: 'Attendance', label: 'الحضور (Attendance)' },
  { value: 'Expense', label: 'المصروفات (Expense)' },
  { value: 'ItemSale', label: 'المبيعات (ItemSale)' },
  { value: 'MembershipPlan', label: 'خطط العضوية (Plan)' },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const limit = 25;

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await api.get<AuditStats>('/audit-logs/stats');
      setStats(data);
    } catch {
      // Ignored
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (selectedAction && selectedAction !== 'ALL') {
        params.append('action', selectedAction);
      }
      if (selectedEntity && selectedEntity !== 'ALL') {
        params.append('entity', selectedEntity);
      }

      const res = await api.get<{ logs: AuditLog[]; total: number; page: number }>(
        `/audit-logs?${params.toString()}`
      );
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل في تحميل سجل العمليات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, selectedAction, selectedEntity, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side quick search filter on current page
  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.summary && log.summary.toLowerCase().includes(q)) ||
      (log.user?.fullName && log.user.fullName.toLowerCase().includes(q)) ||
      (log.user?.email && log.user.email.toLowerCase().includes(q)) ||
      (log.ip && log.ip.includes(q)) ||
      (log.entityId && log.entityId.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(total / limit) || 1;

  if (user && user.role !== 'OWNER') {
    return (
      <DashboardShell title="سجل العمليات">
        <Card className="p-8 text-center border-red-500/20 bg-red-500/5">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">صلاحية غير كافية</h2>
          <p className="text-zinc-400 text-sm">
            هذا القسم مخصص فقط لمالك الجيم (OWNER) لمتابعة العمليات وسجلات الأمان.
          </p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="سجل العمليات">
      <div className="space-y-6">
        <PageHeader
          title="سجل العمليات (Audit Logs)"
          description="مراقبة وتتبع جميع الحركات والتعديلات التي تتم في النظام بالوقت والتفاصيل"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchStats();
                fetchLogs();
              }}
              className="gap-2 border-[#27272A] text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث السجل
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-[#27272A] bg-[#18181B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">إجمالي العمليات المسجلة</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {statsLoading ? '...' : (stats?.total ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-[#F97316]/10 rounded-xl">
                <Shield className="w-5 h-5 text-[#F97316]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-[#27272A] bg-[#18181B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">العمليات آخر 30 يوم</p>
                <p className="text-2xl font-bold text-[#22C55E] mt-1">
                  {statsLoading ? '...' : (stats?.recent ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-[#22C55E]/10 rounded-xl">
                <Activity className="w-5 h-5 text-[#22C55E]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-[#27272A] bg-[#18181B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">عمليات الإنشاء</p>
                <p className="text-2xl font-bold text-[#3B82F6] mt-1">
                  {statsLoading
                    ? '...'
                    : (stats?.byAction.find((a) => a.action === 'CREATE')?._count ?? 0)}
                </p>
              </div>
              <div className="p-3 bg-[#3B82F6]/10 rounded-xl">
                <UserCheck className="w-5 h-5 text-[#3B82F6]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-[#27272A] bg-[#18181B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">عمليات التعديل والحذف</p>
                <p className="text-2xl font-bold text-[#F59E0B] mt-1">
                  {statsLoading
                    ? '...'
                    : ((stats?.byAction.find((a) => a.action === 'UPDATE')?._count ?? 0) +
                        (stats?.byAction.find((a) => a.action === 'DELETE')?._count ?? 0))}
                </p>
              </div>
              <div className="p-3 bg-[#F59E0B]/10 rounded-xl">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4 border-[#27272A] bg-[#18181B]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="البحث في تفاصيل السجل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 bg-[#121214] border-[#27272A] text-right"
              />
            </div>

            <div>
              <Select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                options={ACTION_OPTIONS}
                className="bg-[#121214] border-[#27272A] text-zinc-200"
              />
            </div>

            <div>
              <Select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                options={ENTITY_OPTIONS}
                className="bg-[#121214] border-[#27272A] text-zinc-200"
              />
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="border-[#27272A] bg-[#18181B] overflow-hidden">
          <CardHeader className="p-4 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F97316]" />
              <h3 className="font-semibold text-white text-sm">سجل الأنشطة والعمليات</h3>
            </div>
            <span className="text-xs text-zinc-400">
              إجمالي النتائج: {total} عملية
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<Shield className="w-10 h-10 text-zinc-600" />}
                  title="لا توجد عمليات مطابقة"
                  description="لم يتم العثور على أي سجلات تطابق الفلاتر المحددة حالياً."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#121214] text-zinc-400 text-xs border-b border-[#27272A]">
                    <tr>
                      <th className="py-3 px-4">التاريخ والوقت</th>
                      <th className="py-3 px-4">المستخدم</th>
                      <th className="py-3 px-4">نوع الإجراء</th>
                      <th className="py-3 px-4">القسم</th>
                      <th className="py-3 px-4">تفاصيل العملية</th>
                      <th className="py-3 px-4">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50">
                    {filteredLogs.map((log) => {
                      const actionInfo = ACTION_LABELS[log.action] || {
                        label: log.action,
                        variant: 'neutral' as const,
                      };
                      const entityName = ENTITY_LABELS[log.entity] || log.entity;

                      return (
                        <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-xs font-mono text-zinc-300 whitespace-nowrap" dir="ltr">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white">
                                <User className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-white">
                                  {log.user?.fullName || log.user?.email || 'النظام'}
                                </p>
                                {log.user?.role && (
                                  <span className="text-[10px] text-zinc-500">
                                    {log.user.role === 'OWNER' ? 'مالك الجيم' : log.user.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant={actionInfo.variant}>
                              {actionInfo.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-300 whitespace-nowrap">
                            {entityName}
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-300 max-w-xs truncate">
                            {log.summary || `تم تنفيذ عملية ${actionInfo.label} على ${entityName}`}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-zinc-500 whitespace-nowrap" dir="ltr">
                            {log.ip || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#27272A] flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  صفحة {page} من {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="border-[#27272A] gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="border-[#27272A] gap-1"
                  >
                    التالي
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
