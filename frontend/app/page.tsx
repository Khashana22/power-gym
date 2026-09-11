'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './lib/auth-context';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Eye, EyeOff, Dumbbell, Lock, Mail, Zap, Shield, BarChart2 } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (!password) { setError('كلمة المرور مطلوبة'); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من صحة البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  const features = [
    { icon: <Zap className="w-4 h-4" />, text: 'تسجيل حضور ذكي وفوري عبر الباركود و QR' },
    { icon: <Shield className="w-4 h-4" />, text: 'حماية وتشفير متكامل لبيانات الأعضاء' },
    { icon: <BarChart2 className="w-4 h-4" />, text: 'تقارير وإحصائيات مالية بالجنيه المصري لحظة بلحظة' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] flex text-right">
      {/* Right branding panel (RTL) - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F0F11] via-[#18181B] to-[#09090B] flex-col p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-[#F97316] opacity-5 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-[#F97316] opacity-5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#FAFAFA] tracking-wider">POWER GYM</h1>
            <p className="text-xs text-[#71717A]">نظام إدارة الجيم المتكامل</p>
          </div>
        </div>

        {/* Main headline */}
        <div className="mt-auto mb-auto flex flex-col gap-6 relative">
          <div>
            <h2 className="text-4xl font-bold text-[#FAFAFA] leading-tight">
              أدِر جيمك باحترافية<br />
              <span className="text-gradient">وسهولة كاملة</span>
            </h2>
            <p className="text-base text-[#71717A] mt-3 leading-relaxed max-w-sm">
              المنصة الشاملة لإدارة الاشتراكات، ومتابعة حضور الأعضاء، والتقارير المالية والمدفوعات اليومية.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#A1A1AA]">
                <div className="w-7 h-7 rounded-lg bg-[#F9731615] border border-[#F9731630] flex items-center justify-center text-[#F97316]">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-xs text-[#52525B] relative">
          <p>تم التطوير بواسطة: السيد خشانة</p>
          <p dir="ltr" className="text-right">01559666564</p>
        </div>
      </div>

      {/* Left login form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#FAFAFA] tracking-wider">POWER GYM</h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#FAFAFA]">مرحباً بك مجدداً</h2>
            <p className="text-sm text-[#71717A] mt-1">سجل الدخول لحسابك لمتابعة إدارة النظام</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@powergym.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
              id="login-email"
              dir="ltr"
              className="text-left"
            />

            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              autoComplete="current-password"
              id="login-password"
              dir="ltr"
              className="text-left"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#EF444415] border border-[#EF444430]">
                <span className="text-[#EF4444] text-sm">✗</span>
                <p className="text-sm text-[#EF4444]">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={submitting}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <p className="text-center text-xs text-[#52525B] mt-6">
            نظام Power Gym لإدارة الصالات الرياضية - الإصدار 1.0
          </p>
        </div>
      </div>
    </div>
  );
}
