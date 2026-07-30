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
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  const features = [
    { icon: <Zap className="w-4 h-4" />, text: 'Lightning-fast QR Check-in' },
    { icon: <Shield className="w-4 h-4" />, text: 'Secure JWT Authentication' },
    { icon: <BarChart2 className="w-4 h-4" />, text: 'Real-time Revenue Analytics' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F0F11] via-[#18181B] to-[#09090B] flex-col p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#F97316] opacity-5 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-[#F97316] opacity-5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#FAFAFA] tracking-wider">POWER GYM</h1>
            <p className="text-xs text-[#71717A]">Management System</p>
          </div>
        </div>

        {/* Main headline */}
        <div className="mt-auto mb-auto flex flex-col gap-6 relative">
          <div>
            <h2 className="text-4xl font-bold text-[#FAFAFA] leading-tight">
              Manage Your Gym<br />
              <span className="text-gradient">Like a Pro</span>
            </h2>
            <p className="text-base text-[#71717A] mt-3 leading-relaxed max-w-xs">
              All-in-one platform for gym management, member tracking, and revenue analytics.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#A1A1AA]">
                <div className="w-7 h-7 rounded-lg bg-[#F9731615] border border-[#F9731630] flex items-center justify-center text-[#F97316]">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-xs text-[#52525B] relative">
          <p>Developed by Sayed Khashana</p>
          <p>01559666564</p>
        </div>
      </div>

      {/* Right login panel */}
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
            <h2 className="text-2xl font-bold text-[#FAFAFA]">Welcome back</h2>
            <p className="text-sm text-[#71717A] mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@powergym.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
              id="login-email"
            />

            <Input
              label="Password"
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
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-xs text-[#52525B] mt-6">
            Power Gym Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
