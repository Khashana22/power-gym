'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardContent } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import api from '../lib';
import {
  BarChart3, Users, Calendar, Download, FileText,
  TrendingUp, RefreshCw, ArrowUpRight, CreditCard,
  Plus, Coffee, Trash2, X, Check,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface ItemSaleRecord {
  id: string;
  itemName: string;
  amount: number;
  category: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

interface RevenueReport {
  total: number;
  subscriptionsTotal?: number;
  itemSalesTotal?: number;
  chart: { date: string; amount: number }[];
  byMethod: Record<string, number>;
  itemSales?: ItemSaleRecord[];
}

interface AttendanceReport {
  total: number;
  uniqueMembers: number;
  chart: { date: string; count: number }[];
}

interface MembersReport {
  newMembers: { id: string; fullName: string; memberCode: string; createdAt: string; phone?: string }[];
  totalActive: number;
  expiringSoon: number;
  expiringThisMonth: number;
}

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#09090B] p-5 rounded-xl border border-[#27272A]">
      <p className="text-zinc-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(end.getDate())}`,
    label: now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
  };
}

function getPreviousMonthRange() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const end = new Date(year, month + 1, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date(year, month, 1);
  return {
    start: `${year}-${pad(month + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(end.getDate())}`,
    label: d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
  };
}

const quickSaleItems = [
  { name: 'مياه صغيرة', price: 5 },
  { name: 'مياه كبيرة', price: 10 },
  { name: 'عصير طبيعي', price: 20 },
  { name: 'مشروب طاقة', price: 35 },
  { name: 'بروتين شيك', price: 50 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'attendance' | 'members'>('revenue');
  const [periodPreset, setPeriodPreset] = useState<'current_month' | 'prev_month' | 'from_start' | 'custom'>('current_month');
  const [firstRecordDate, setFirstRecordDate] = useState<string | null>(null);

  const initialRange = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);

  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [membersData, setMembersData] = useState<MembersReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick sale modal state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ itemName: '', amount: '' });
  const [savingSale, setSavingSale] = useState(false);

  const { toast } = useToast();

  // Fetch gym meta (first member/payment date)
  useEffect(() => {
    api.get<{ firstRecordDate: string | null }>('/reports/meta')
      .then((res) => {
        if (res?.firstRecordDate) {
          setFirstRecordDate(res.firstRecordDate);
        }
      })
      .catch(() => {});
  }, []);

  const fetchReports = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const params = `startDate=${startDate}&endDate=${endDate}`;
      const [rev, att, mem] = await Promise.all([
        api.get<RevenueReport>(`/reports/revenue?${params}`),
        api.get<AttendanceReport>(`/reports/attendance?${params}`),
        api.get<MembersReport>(`/reports/members?${params}`),
      ]);
      setRevenueData(rev);
      setAttendanceData(att);
      setMembersData(mem);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل التقارير', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Auto-fetch on mount and whenever startDate/endDate change (NO manual button required!)
  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate, fetchReports]);

  // Handle Preset Changes
  const applyPreset = (preset: 'current_month' | 'prev_month' | 'from_start' | 'custom') => {
    setPeriodPreset(preset);
    if (preset === 'current_month') {
      const r = getCurrentMonthRange();
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (preset === 'prev_month') {
      const r = getPreviousMonthRange();
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (preset === 'from_start') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(firstRecordDate || initialRange.start);
      setEndDate(today);
    }
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.itemName.trim()) {
      toast({ title: 'خطأ', description: 'يرجى تحديد أو إدخال اسم الصنف', variant: 'destructive' });
      return;
    }
    const price = parseFloat(saleForm.amount);
    if (isNaN(price) || price <= 0) {
      toast({ title: 'خطأ', description: 'يرجى إدخال سعر صحيح أكبر من الصفر', variant: 'destructive' });
      return;
    }

    try {
      setSavingSale(true);
      await api.post('/sales', {
        itemName: saleForm.itemName.trim(),
        amount: price,
      });
      toast({
        title: 'تم تسجيل البيع بنجاح',
        description: `تمت إضافة (${saleForm.itemName}) بمبلغ ${price} ج.م إلى إجمالي الإيرادات.`,
      });
      setSaleForm({ itemName: '', amount: '' });
      setShowSaleModal(false);
      fetchReports();
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل في تسجيل العملية',
        variant: 'destructive',
      });
    } finally {
      setSavingSale(false);
    }
  };

  const handleDeleteSale = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف عملية بيع (${name})؟ سيتم خصمها من الإيرادات.`)) return;
    try {
      await api.del(`/sales/${id}`);
      toast({ title: 'تم الحذف', description: 'تم حذف العملية وخصم قيمتها من الإيرادات بنجاح' });
      fetchReports();
    } catch {
      toast({ title: 'خطأ', description: 'فشل حذف العملية', variant: 'destructive' });
    }
  };

  const handleExport = async (type: 'pdf' | 'excel', dataset: 'revenue' | 'attendance') => {
    const params = `startDate=${startDate}&endDate=${endDate}`;
    const url = type === 'pdf'
      ? `/reports/export/${dataset}/pdf?${params}`
      : `/reports/export/${dataset}/excel?${params}`;

    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}${url}`, '_blank');
    } catch {
      toast({ title: 'فشل التصدير', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const revenueChart = (revenueData?.chart || []).map((d) => ({
    ...d,
    date: formatDate(d.date),
    amount: Math.round(d.amount),
  }));

  const attendanceChart = (attendanceData?.chart || []).map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  const getMethodName = (method: string) => {
    switch(method) {
      case 'CASH': return 'كاش';
      case 'VISA': return 'فيزا';
      case 'INSTAPAY': return 'إنستاباي';
      case 'VODAFONE_CASH': return 'فودافون كاش';
      default: return method;
    }
  };

  const currentMonth = getCurrentMonthRange();
  const prevMonth = getPreviousMonthRange();

  return (
    <DashboardShell title="التقارير والإحصائيات المالية">
      <div className="space-y-6">

        {/* ── Period Selector & Filter Controls ───────────────────────── */}
        <div className="bg-[#18181B] p-4 rounded-xl border border-[#27272A] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Period Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 text-xs font-medium ml-1">عرض حسب:</span>
              <button
                type="button"
                onClick={() => applyPreset('current_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === 'current_month'
                    ? 'bg-[#F97316] text-white shadow-md'
                    : 'bg-[#27272A] text-zinc-300 hover:bg-[#3F3F46]'
                }`}
              >
                {currentMonth.label} (الشهر الحالي)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('prev_month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === 'prev_month'
                    ? 'bg-[#F97316] text-white shadow-md'
                    : 'bg-[#27272A] text-zinc-300 hover:bg-[#3F3F46]'
                }`}
              >
                {prevMonth.label} (الشهر السابق)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('from_start')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === 'from_start'
                    ? 'bg-[#F97316] text-white shadow-md'
                    : 'bg-[#27272A] text-zinc-300 hover:bg-[#3F3F46]'
                }`}
              >
                منذ تسجيل أول عضو
              </button>
              <button
                type="button"
                onClick={() => setPeriodPreset('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === 'custom'
                    ? 'bg-[#F97316] text-white shadow-md'
                    : 'bg-[#27272A] text-zinc-300 hover:bg-[#3F3F46]'
                }`}
              >
                تاريخ مخصص
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf', activeTab === 'attendance' ? 'attendance' : 'revenue')}
                className="border-[#27272A] text-white hover:bg-[#27272A] text-xs h-8"
              >
                <FileText className="w-3.5 h-3.5 ml-1.5" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel', activeTab === 'attendance' ? 'attendance' : 'revenue')}
                className="border-[#27272A] text-white hover:bg-[#27272A] text-xs h-8"
              >
                <Download className="w-3.5 h-3.5 ml-1.5" /> Excel
              </Button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#27272A]">
            <span className="text-zinc-400 text-xs">من تاريخ:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-[#09090B] border-[#27272A] text-white w-36 text-center text-xs h-9"
            />
            <span className="text-zinc-400 text-xs">إلى تاريخ:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-[#09090B] border-[#27272A] text-white w-36 text-center text-xs h-9"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-400 hover:text-white text-xs h-9"
              onClick={fetchReports}
              disabled={loading}
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ml-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'جاري التحميل…' : 'تحديث'}
            </Button>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────── */}
        <div className="flex border-b border-[#27272A]">
          {([
            { key: 'revenue', icon: TrendingUp, label: 'التقارير المالية والمبيعات' },
            { key: 'attendance', icon: Calendar, label: 'تقارير الحضور' },
            { key: 'members', icon: Users, label: 'تقارير الأعضاء' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(key)}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Revenue Tab ────────────────────────────────────────────── */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">

            {/* Header with Quick Sale Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#18181B] p-4 rounded-xl border border-[#27272A]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F97316]" />
                  الإيرادات ومبيعات البوفيه
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  إجمالي التحصيل المالي للفترة المحددة شامل الاشتراكات ومبيعات المشروبات
                </p>
              </div>
              <Button
                onClick={() => setShowSaleModal(true)}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold flex items-center gap-1.5 text-sm shadow-md"
              >
                <Plus className="w-4 h-4" />
                تسجيل بيع مشروب / مياه
              </Button>
            </div>

            {/* Stats Cards Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="إجمالي الإيرادات الكلي"
                value={`${(revenueData?.total || 0).toLocaleString('ar-EG')} ج.م`}
                sub="شامل كافة الاشتراكات والمبيعات"
                color="text-[#F97316]"
              />
              <StatCard
                label="إيرادات الاشتراكات"
                value={`${(revenueData?.subscriptionsTotal ?? revenueData?.total ?? 0).toLocaleString('ar-EG')} ج.م`}
                sub="تحصيل خطط اشتراكات الأعضاء"
                color="text-white"
              />
              <StatCard
                label="مبيعات المشروبات والمياه"
                value={`${(revenueData?.itemSalesTotal || 0).toLocaleString('ar-EG')} ج.م`}
                sub="مبيعات البوفيه والعصائر"
                color="text-[#22C55E]"
              />
              <StatCard
                label="المتوسط اليومي للإيراد"
                value={`${Math.round((revenueData?.total || 0) / Math.max(revenueChart.length, 1)).toLocaleString('ar-EG')} ج.م`}
                sub="معدل التحصيل اليومي بالفترة"
              />
            </div>

            {/* Dedicated Item Sales Section (سجل مبيعات المشروبات والمياه) */}
            <Card className="border-[#27272A] bg-[#18181B]">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[#22C55E]" />
                    <h3 className="text-base font-bold text-white">سجل مبيعات المشروبات والمياه (البوفيه)</h3>
                  </div>
                  <span className="text-xs bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-3 py-1 rounded-full font-medium">
                    إجمالي المبيعات: {(revenueData?.itemSalesTotal || 0).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                {revenueData?.itemSales && revenueData.itemSales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead>
                        <tr className="text-zinc-500 border-b border-[#27272A] text-xs">
                          <th className="py-2.5 pl-4">اسم الصنف</th>
                          <th className="py-2.5 pl-4">التصنيف</th>
                          <th className="py-2.5 pl-4">السعر</th>
                          <th className="py-2.5 pl-4">التاريخ والوقت</th>
                          <th className="py-2.5 text-left">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272A]/50">
                        {revenueData.itemSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-[#27272A]/30 transition-colors">
                            <td className="py-3 pl-4 text-white font-medium">{sale.itemName}</td>
                            <td className="py-3 pl-4 text-zinc-400 text-xs">{sale.category || 'مشروبات'}</td>
                            <td className="py-3 pl-4 text-[#22C55E] font-bold font-mono">
                              {sale.amount.toLocaleString('ar-EG')} ج.م
                            </td>
                            <td className="py-3 pl-4 text-zinc-400 text-xs">
                              {new Date(sale.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 text-left">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteSale(sale.id, sale.itemName)}
                                className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                title="حذف العملية وخصمها من الإيراد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 text-sm">
                    لا توجد مبيعات مشروبات مسجلة في هذه الفترة. يمكنك الضغط على "تسجيل بيع مشروب / مياه" بالأعلى لتسجيل بيع جديد.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Trend Chart */}
            <Card className="border-[#27272A] bg-[#18181B]">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-[#F97316]" />
                  اتجاه الإيرادات اليومية بالفترة
                </h3>
                {revenueChart.length > 0 ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                        <XAxis dataKey="date" stroke="#71717A" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#71717A" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#fff', direction: 'rtl' }}
                          itemStyle={{ color: '#F97316' }}
                          formatter={(v: any) => [`${Number(v).toLocaleString('ar-EG')} ج.م`, 'الإيراد']}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#F97316' }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-zinc-500">
                    {loading ? 'جاري تحميل الرسم البياني…' : 'لا توجد بيانات إيرادات لهذه الفترة'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Method breakdown */}
            {revenueData?.byMethod && Object.keys(revenueData.byMethod).length > 0 && (
              <Card className="border-[#27272A] bg-[#18181B]">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#F97316]" /> الإيرادات حسب طريقة الدفع
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(revenueData.byMethod).map(([method, amount]) => {
                      const pct = Math.round(((amount as number) / Math.max(revenueData.total, 1)) * 100);
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-300">{getMethodName(method)}</span>
                            <span className="text-white font-medium">{(amount as number).toLocaleString('ar-EG')} ج.م ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#F97316] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Attendance Tab ────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="إجمالي تسجيلات الحضور" value={(attendanceData?.total || 0).toLocaleString('ar-EG')} color="text-blue-400" />
              <StatCard label="أعضاء فريدين" value={(attendanceData?.uniqueMembers || 0).toLocaleString('ar-EG')} />
              <StatCard
                label="المتوسط اليومي"
                value={Math.round((attendanceData?.total || 0) / Math.max(attendanceChart.length, 1)).toLocaleString('ar-EG')}
              />
            </div>

            <Card className="border-[#27272A] bg-[#18181B]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  الحضور اليومي
                </h3>
                {attendanceChart.length > 0 ? (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717A" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#71717A" tick={{ fontSize: 12 }} />
                        <Tooltip
                          cursor={{ fill: '#27272A' }}
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#fff', direction: 'rtl' }}
                          formatter={(v: any) => [v, 'حضور']}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500">
                    {loading ? 'جاري تحميل الرسم البياني…' : 'لا توجد بيانات حضور لهذه الفترة'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Members Tab ───────────────────────────────────────────── */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="إجمالي المشتركين النشطين" value={(membersData?.totalActive || 0).toLocaleString('ar-EG')} color="text-green-400" />
              <StatCard label="أعضاء جدد هذه الفترة" value={(membersData?.newMembers?.length || 0).toLocaleString('ar-EG')} color="text-[#F97316]" />
              <StatCard label="ينتهي اشتراكهم خلال 7 أيام" value={(membersData?.expiringSoon || 0).toLocaleString('ar-EG')} color="text-yellow-400" />
              <StatCard label="ينتهي اشتراكهم هذا الشهر" value={(membersData?.expiringThisMonth || 0).toLocaleString('ar-EG')} />
            </div>

            {(membersData?.newMembers || []).length > 0 && (
              <Card className="border-[#27272A] bg-[#18181B]">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">
                    الأعضاء الجدد ({membersData!.newMembers.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead>
                        <tr className="text-zinc-500 border-b border-[#27272A]">
                          <th className="py-2 pl-4">كود العضو</th>
                          <th className="py-2 pl-4">الاسم</th>
                          <th className="py-2 pl-4">رقم الهاتف</th>
                          <th className="py-2">تاريخ الانضمام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membersData!.newMembers.map((m) => (
                          <tr key={m.id} className="border-b border-[#27272A]/50 hover:bg-[#27272A]/30 transition-colors">
                            <td className="py-2.5 pl-4 text-[#F97316] font-mono text-xs">{m.memberCode}</td>
                            <td className="py-2.5 pl-4 text-white font-medium">{m.fullName}</td>
                            <td className="py-2.5 pl-4 text-zinc-400 font-mono" dir="ltr">{m.phone || '-'}</td>
                            <td className="py-2.5 text-zinc-400">
                              {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Modal: تسجيل بيع مشروب / مياه ────────────────────────────── */}
        {showSaleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-[#27272A] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Coffee className="w-5 h-5 text-[#22C55E]" />
                  <span>تسجيل بيع مشروب / مياه</span>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">اختيار سريع للصنف:</label>
                <div className="flex flex-wrap gap-2">
                  {quickSaleItems.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSaleForm({ itemName: item.name, amount: item.price.toString() })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        saleForm.itemName === item.name
                          ? 'border-[#22C55E] bg-[#22C55E]/20 text-[#22C55E] font-bold'
                          : 'border-[#27272A] bg-[#09090B] text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {item.name} ({item.price} ج.م)
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveSale} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">اسم الصنف / المشروب *</label>
                  <Input
                    placeholder="مثال: مياه معدنية، عصير برتقال، ..."
                    value={saleForm.itemName}
                    onChange={(e) => setSaleForm({ ...saleForm, itemName: e.target.value })}
                    className="bg-[#09090B] border-[#27272A] text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-medium">السعر (ج.م) *</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="مثال: 10 أو 25"
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                    className="bg-[#09090B] border-[#27272A] text-white font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaleModal(false)}
                    className="border-[#27272A] text-zinc-300 hover:bg-[#27272A]"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingSale}
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold min-w-28"
                  >
                    {savingSale ? 'جاري الحفظ…' : 'حفظ في الإيراد'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
