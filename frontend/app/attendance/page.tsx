'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardContent } from '../components/ui';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import api from '../lib';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ScanLine,
  User,
  Clock,
  CalendarDays,
  Users,
  Camera,
  CameraOff,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type CheckInResult =
  | {
      kind: 'success';
      memberName: string;
      memberCode: string;
      subscriptionStatus: string | null;
      plan: string | null;
      checkedInAt: string;
    }
  | {
      kind: 'duplicate';
      memberName: string;
      memberCode: string;
      previousCheckInTime: string;
    }
  | { kind: 'error'; message: string };

type TodayRecord = {
  id: string;
  checkIn: string;
  member: {
    id: string;
    fullName: string;
    memberCode: string;
    photo: string | null;
    subscriptions: { status: string }[];
  };
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'نشط', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    case 'EXPIRED':
      return { label: 'منتهي', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    case 'FROZEN':
      return { label: 'مجمّد', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    default:
      return { label: 'غير معروف', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
  }
}

// ─── QR Scanner Component ────────────────────────────────────────────────────

type QrScannerProps = {
  onScan: (code: string) => void;
  onClose: () => void;
};

function QrScannerOverlay({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<InstanceType<typeof import('html5-qrcode')['Html5Qrcode']> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        if (cancelled || !containerRef.current) return;

        const qr = new Html5Qrcode('qr-scanner-container');
        scannerRef.current = qr;

        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            stopScanner().then(() => {
              onScan(decodedText.trim());
            });
          },
          () => {
            // ignore per-frame decode errors
          },
        );

        if (!cancelled) setStarting(false);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('notallowed')
        ) {
          setError('تم رفض إذن الكاميرا. يرجى السماح للمتصفح بالوصول إلى الكاميرا.');
        } else if (
          msg.toLowerCase().includes('notfound') ||
          msg.toLowerCase().includes('no camera')
        ) {
          setError('لم يتم العثور على كاميرا في هذا الجهاز.');
        } else {
          setError('فشل تشغيل الكاميرا. تأكد من السماح بالوصول وأعد المحاولة.');
        }
        setStarting(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col items-center gap-4 shadow-2xl">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#F97316]" />
            مسح QR كود
          </h3>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#27272A]"
            aria-label="إغلاق"
          >
            <CameraOff className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            <Button
              onClick={handleClose}
              className="mt-2 bg-[#27272A] hover:bg-[#3f3f46] text-white border-0"
            >
              إغلاق
            </Button>
          </div>
        ) : (
          <>
            <div className="relative w-full rounded-xl overflow-hidden border border-[#27272A]">
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#09090B] z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">جاري تشغيل الكاميرا...</p>
                  </div>
                </div>
              )}
              {/* html5-qrcode mounts the video into this div */}
              <div
                id="qr-scanner-container"
                ref={containerRef}
                style={{ width: '100%', minHeight: '300px' }}
              />
            </div>
            <p className="text-zinc-400 text-xs text-center">
              ضع QR كود العضو داخل الإطار ليتم المسح تلقائياً
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [memberCode, setMemberCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [monthCount, setMonthCount] = useState<number>(0);
  const [loadingToday, setLoadingToday] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const focusInput = () => inputRef.current?.focus();

  // Fetch today's attendance data
  const fetchToday = useCallback(async () => {
    try {
      setLoadingToday(true);
      const [todayData, monthData] = await Promise.all([
        api.get<TodayRecord[]>('/attendance/today'),
        api.get<number>('/attendance/month-count'),
      ]);
      setTodayRecords(todayData);
      setMonthCount(monthData);
    } catch {
      // ignore
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    focusInput();
    fetchToday();
  }, [fetchToday]);

  const handleCheckIn = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      setLoading(true);
      setResult(null);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

      try {
        const response = await api.post<{
          alreadyCheckedIn: boolean;
          previousCheckInTime?: string;
          member: { fullName: string; memberCode: string };
          subscriptionStatus: string | null;
          plan: string | null;
          checkedInAt?: string;
        }>('/attendance/checkin', { memberCode: trimmed });

        if (response.alreadyCheckedIn) {
          setResult({
            kind: 'duplicate',
            memberName: response.member.fullName,
            memberCode: response.member.memberCode,
            previousCheckInTime: response.previousCheckInTime!,
          });
        } else {
          setResult({
            kind: 'success',
            memberName: response.member.fullName,
            memberCode: response.member.memberCode,
            subscriptionStatus: response.subscriptionStatus,
            plan: response.plan,
            checkedInAt: response.checkedInAt!,
          });
          // Refresh the today list on successful check-in
          fetchToday();
        }
      } catch (error: any) {
        const message =
          error.response?.data?.message || error.message || 'فشل تسجيل الحضور';
        setResult({ kind: 'error', message });
      } finally {
        setLoading(false);
        setMemberCode('');
        clearTimerRef.current = setTimeout(() => {
          setResult(null);
          focusInput();
        }, 6000);
      }
    },
    [fetchToday],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(memberCode);
  };

  // Auto-submit when a member code pattern is typed (PG-XXXX)
  useEffect(() => {
    if (/^PG-\d{4,}$/i.test(memberCode.trim())) {
      const timer = setTimeout(() => handleCheckIn(memberCode), 200);
      return () => clearTimeout(timer);
    }
  }, [memberCode, handleCheckIn]);

  // Called by the QR scanner once a code is decoded
  const handleQrScan = useCallback(
    (scannedCode: string) => {
      setShowScanner(false);
      setMemberCode(scannedCode);
      handleCheckIn(scannedCode);
    },
    [handleCheckIn],
  );

  return (
    <DashboardShell title="تسجيل الحضور">
      {showScanner && (
        <QrScannerOverlay
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="space-y-6" dir="rtl">
        {/* ── Check-in Input ─────────────────────────────────────── */}
        <Card className="border-[#27272A] bg-[#18181B] shadow-xl">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-[#F97316]/10 p-5 rounded-full border border-[#F97316]/20">
                <ScanLine className="w-12 h-12 text-[#F97316]" />
              </div>

              <div className="w-full max-w-lg space-y-3">
                <h2 className="text-2xl font-bold text-white">تسجيل الحضور</h2>
                <p className="text-zinc-400 text-sm">
                  امسح QR كود العضو أو أدخل كوده يدوياً
                </p>

                <form onSubmit={onSubmit} className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    className="h-14 px-8 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-lg"
                    disabled={loading || !memberCode.trim()}
                  >
                    {loading ? '...' : 'دخول'}
                  </Button>
                  <Input
                    ref={inputRef}
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    placeholder="أدخل كود العضو أو امسح QR"
                    className="h-14 text-lg bg-[#09090B] border-[#27272A] focus:border-[#F97316] text-center font-mono"
                    autoFocus
                    disabled={loading}
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    disabled={loading || showScanner}
                    className="h-14 px-4 bg-[#27272A] hover:bg-[#3f3f46] text-white border border-[#3f3f46] flex items-center gap-2 whitespace-nowrap"
                    title="مسح QR بالكاميرا"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">مسح QR</span>
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Result Banner ──────────────────────────────────────── */}
        {result && (
          <div
            className={`rounded-xl p-6 md:p-8 border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 shadow-xl ${
              result.kind === 'success'
                ? 'bg-green-500/10 border-green-500/30'
                : result.kind === 'duplicate'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            {result.kind === 'success' && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500">
                    <User className="w-10 h-10 text-green-400" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-right space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{result.memberName}</h3>
                    <p className="text-zinc-400 font-mono text-sm">{result.memberCode}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                    {result.subscriptionStatus && (
                      <span
                        className={`text-sm px-3 py-1 rounded-full border font-medium ${getStatusLabel(result.subscriptionStatus).color}`}
                      >
                        {result.plan
                          ? `${result.plan} · ${getStatusLabel(result.subscriptionStatus).label}`
                          : getStatusLabel(result.subscriptionStatus).label}
                      </span>
                    )}
                    <span className="text-sm px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(result.checkedInAt)}
                    </span>
                  </div>

                  <p className="text-green-400 font-semibold text-lg flex items-center gap-2 justify-center sm:justify-end">
                    <CheckCircle2 className="w-5 h-5" />
                    تم تسجيل الحضور بنجاح
                  </p>
                </div>
              </div>
            )}

            {result.kind === 'duplicate' && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500 flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-xl font-bold text-amber-400">{result.memberName}</h3>
                  <p className="text-zinc-300 mt-1 text-lg">
                    هذا العضو سجّل حضوره اليوم بالفعل
                  </p>
                  <p className="text-zinc-400 text-sm mt-1 flex items-center gap-1 justify-center sm:justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    وقت الدخول السابق: {formatTime(result.previousCheckInTime)}
                  </p>
                </div>
              </div>
            )}

            {result.kind === 'error' && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500 flex-shrink-0">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-xl font-bold text-red-400">خطأ</h3>
                  <p className="text-zinc-300 mt-1">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex items-center gap-4 text-right"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-[#F97316]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loadingToday ? '...' : todayRecords.length}
              </p>
              <p className="text-sm text-zinc-400">حضور اليوم</p>
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {loadingToday ? '...' : monthCount}
              </p>
              <p className="text-sm text-zinc-400">حضور هذا الشهر</p>
            </div>
          </div>
        </div>

        {/* ── Today's Attendance Table ──────────────────────────── */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <div className="p-5 border-b border-[#27272A] flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">سجل الحضور اليوم</h3>
            <span className="text-xs text-zinc-400">{todayRecords.length} عضو</span>
          </div>
          <div className="overflow-x-auto">
            {loadingToday ? (
              <div className="p-8 text-center text-zinc-500">جاري التحميل...</div>
            ) : todayRecords.length === 0 ? (
              <div className="p-10 text-center text-zinc-500">
                <ScanLine className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>لا يوجد حضور اليوم بعد</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272A]">
                    <th className="px-5 py-3 text-right text-zinc-400 font-medium">وقت الدخول</th>
                    <th className="px-5 py-3 text-right text-zinc-400 font-medium">كود العضو</th>
                    <th className="px-5 py-3 text-right text-zinc-400 font-medium">اسم العضو</th>
                    <th className="px-5 py-3 text-right text-zinc-400 font-medium">حالة الاشتراك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {todayRecords.map((rec) => {
                    const subStatus = rec.member.subscriptions?.[0]?.status ?? null;
                    const statusInfo = getStatusLabel(subStatus);
                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-[#1F1F23] transition-colors"
                      >
                        <td className="px-5 py-3 text-zinc-300 font-mono">
                          {formatTime(rec.checkIn)}
                        </td>
                        <td className="px-5 py-3 text-zinc-300 font-mono">
                          {rec.member.memberCode}
                        </td>
                        <td className="px-5 py-3 text-white font-medium">
                          {rec.member.fullName}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
