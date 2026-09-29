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
  Modal,
} from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import {
  Database,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  Users,
  CreditCard,
  Receipt,
  QrCode,
  Package,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import api from '../lib';
import { useAuth } from '../lib/auth-context';

interface SnapshotItem {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  label?: string;
  summary?: {
    members: number;
    subscriptions: number;
    payments: number;
    attendance: number;
    itemSales: number;
    plans: number;
  };
}

interface DatabaseSummary {
  gymName: string;
  members: number;
  plans: number;
  subscriptions: number;
  payments: number;
  attendance: number;
  itemSales: number;
  expenses: number;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function SnapshotsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [summary, setSummary] = useState<DatabaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, summaryRes] = await Promise.allSettled([
        api.get<{ snapshots: SnapshotItem[] }>('/snapshots'),
        api.get<DatabaseSummary>('/snapshots/summary'),
      ]);

      if (listRes.status === 'fulfilled') {
        setSnapshots(listRes.value.snapshots || []);
      }
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // One-click instant backup download
  const handleExportBackup = async () => {
    try {
      setExporting(true);
      toast({
        title: 'جارٍ التصدير...',
        description: 'يتم الآن تجميع بيانات الجيم لإنشاء النسخة الاحتياطية',
      });

      const data = await api.get<any>('/snapshots/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `powergym-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'تم التنزيل بنجاح',
        description: 'تم تحميل ملف النسخة الاحتياطية على جهازك بنجاح',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'خطأ أثناء التصدير',
        description: err.message || 'فشل في سحب النسخة الاحتياطية',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Create manual snapshot on system
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/snapshots', { label: label.trim() || undefined });
      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ نقطة الاستعادة بنجاح',
        variant: 'success',
      });
      setModalOpen(false);
      setLabel('');
      fetchData();
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل في إنشاء نقطة الاستعادة',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Delete snapshot
  const handleDelete = async (fileName: string) => {
    if (!confirm('هل أنت متأكد من حذف ملف النسخة الاحتياطية هذا؟')) return;
    try {
      setDeletingFile(fileName);
      await api.del(`/snapshots/${encodeURIComponent(fileName)}`);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف ملف النسخة الاحتياطية',
        variant: 'success',
      });
      setSnapshots((prev) => prev.filter((s) => s.fileName !== fileName));
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل في حذف الملف',
        variant: 'destructive',
      });
    } finally {
      setDeletingFile(null);
    }
  };

  if (user && user.role !== 'OWNER') {
    return (
      <DashboardShell title="النسخ الاحتياطي">
        <Card className="p-8 text-center border-red-500/20 bg-red-500/5">
          <Database className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">صلاحية غير كافية</h2>
          <p className="text-zinc-400 text-sm">
            هذا القسم مخصص فقط لمالك الجيم (OWNER) لإدارة النسخ الاحتياطية وقاعدة البيانات.
          </p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="النسخ الاحتياطي">
      <div className="space-y-6">
        <PageHeader
          title="النسخ الاحتياطي واستعادة البيانات"
          description="حفظ وتأمين بيانات الجيم وتنزيل نسخ كاملة على جهازك بضغطة زر"
          action={
            <div className="flex gap-2">
              <Button
                onClick={handleExportBackup}
                disabled={exporting}
                className="gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-medium"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'جارٍ التصدير...' : 'تحميل نسخة احتياطية فورية (JSON)'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="gap-2 border-[#27272A] text-zinc-300 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                حفظ نقطة استعادة
              </Button>
            </div>
          }
        />

        {/* Security & Cloud Safety Banner */}
        <Card className="border-[#22C55E]/30 bg-[#22C55E]/5 p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#22C55E]/10 rounded-xl text-[#22C55E] flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-base">
                بياناتك محمية سحابياً بأعلى معايير الأمان
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                قاعدة البيانات مستضافة على سيرفرات <strong>Neon Cloud PostgreSQL</strong> المشفرة مع
                نسخ احتياطي تلقائي للعمليات (WAL Replication) وميزة الاسترجاع الزمني (Point-in-Time
                Recovery). البيانات منفصلة تماماً عن موقع الويب وتظل آمنة حتى في حال إعادة تشغيل أو
                تحديث الموقع.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-[#22C55E]">
                  <FileCheck className="w-3.5 h-3.5" /> استرجاع حتى أي ثانية سابقة
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <HardDrive className="w-3.5 h-3.5" /> إمكانية حفظ نسخة كاملة على اللابتوب أو فلاشة
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Database Summary Grid */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#F97316]" />
            ملخص البيانات المسجلة حالياً في النظام
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <Users className="w-5 h-5 text-[#F97316] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">الأعضاء</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading ? '...' : (summary?.members ?? 0)}
              </p>
            </Card>

            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <Package className="w-5 h-5 text-[#3B82F6] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">باقات الاشتراك</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading ? '...' : (summary?.plans ?? 0)}
              </p>
            </Card>

            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <CreditCard className="w-5 h-5 text-[#22C55E] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">الاشتراكات</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading ? '...' : (summary?.subscriptions ?? 0)}
              </p>
            </Card>

            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <Receipt className="w-5 h-5 text-[#F59E0B] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">المدفوعات</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading ? '...' : (summary?.payments ?? 0)}
              </p>
            </Card>

            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <QrCode className="w-5 h-5 text-[#A855F7] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">سجلات الحضور</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading ? '...' : (summary?.attendance ?? 0)}
              </p>
            </Card>

            <Card className="p-3 border-[#27272A] bg-[#18181B] text-center">
              <HardDrive className="w-5 h-5 text-[#06B6D4] mx-auto mb-1.5" />
              <p className="text-xs text-zinc-400">المبيعات والمصروفات</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {loading
                  ? '...'
                  : ((summary?.itemSales ?? 0) + (summary?.expenses ?? 0))}
              </p>
            </Card>
          </div>
        </div>

        {/* Snapshots Table */}
        <Card className="border-[#27272A] bg-[#18181B] overflow-hidden">
          <CardHeader className="p-4 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#F97316]" />
              <h3 className="font-semibold text-white text-sm">سجل نقاط الاستعادة والنسخ المحفوظة</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-1 text-xs border-[#27272A] text-zinc-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <EmptyState
                  icon={<Database className="w-10 h-10 text-zinc-600" />}
                  title="لا توجد نقاط استعادة محفوظة محلياً"
                  description="اضغط على زر (تحميل نسخة احتياطية فورية) أعلاه لتنزيل نسخة كاملة على جهازك، أو أنشئ نقطة استعادة جديدة."
                  action={
                    <Button
                      onClick={handleExportBackup}
                      disabled={exporting}
                      className="mt-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تحميل نسخة احتياطية الآن
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#121214] text-zinc-400 text-xs border-b border-[#27272A]">
                    <tr>
                      <th className="py-3 px-4">اسم النسخة / التسمية</th>
                      <th className="py-3 px-4">تاريخ الإنشاء</th>
                      <th className="py-3 px-4">حجم الملف</th>
                      <th className="py-3 px-4">محتوى النسخة</th>
                      <th className="py-3 px-4 text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50">
                    {snapshots.map((snap) => (
                      <tr key={snap.fileName} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#F97316]" />
                            <div>
                              <p className="text-xs font-medium text-white">{snap.label || 'نسخة يدوية'}</p>
                              <p className="text-[10px] font-mono text-zinc-500 truncate max-w-xs" dir="ltr">
                                {snap.fileName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-zinc-300 whitespace-nowrap" dir="ltr">
                          {formatDate(snap.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400 whitespace-nowrap">
                          {formatBytes(snap.sizeBytes)}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400 whitespace-nowrap">
                          {snap.summary ? (
                            <span className="text-[11px] text-zinc-400">
                              {snap.summary.members} عضو • {snap.summary.subscriptions} اشتراك
                            </span>
                          ) : (
                            <Badge variant="neutral">كامل البيانات</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-left whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = `/api/proxy/snapshots/${encodeURIComponent(snap.fileName)}/download`;
                                a.download = snap.fileName;
                                a.click();
                              }}
                              className="h-8 px-2.5 text-xs border-[#27272A] text-zinc-300 hover:text-white gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-[#F97316]" />
                              تحميل
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingFile === snap.fileName}
                              onClick={() => handleDelete(snap.fileName)}
                              className="h-8 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for creating a snapshot */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="حفظ نقطة استعادة جديدة (Snapshot)"
        >
          <form onSubmit={handleCreateSnapshot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                تسمية النسخة (اختياري)
              </label>
              <Input
                placeholder="مثال: قبل_بداية_الشهر أو بعد_تحديث_الاسعار"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-[#121214] border-[#27272A] text-right"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                سيتم تضمين جميع الأعضاء، الاشتراكات، الحضور، والمدفوعات الحالية في هذه النقطة.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-[#27272A]"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white gap-1.5"
              >
                {creating ? 'جارٍ الإنشاء...' : 'حفظ النسخة'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
