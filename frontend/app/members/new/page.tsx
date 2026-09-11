'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, UserPlus } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard-shell';
import { Card, CardContent, CardHeader, PageHeader, Spinner } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import api from '../../lib';

export default function NewMemberPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم هاتف مصري غير صالح (يجب أن يبدأ بـ 01 ويتكون من 11 رقماً)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const data = await api.post<{ id: string }>('/members', formData);
      showToast({ title: 'تم بنجاح', message: 'تم تسجيل العضو بنجاح', type: 'success' });
      router.push(`/members/${data.id}`);
    } catch (err: any) {
      showToast({ title: 'خطأ', message: err.message || 'فشل في تسجيل العضو', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="إضافة عضو جديد">
      <div className="mb-6">
        <Link href="/members" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowRight className="h-4 w-4 ml-1" />
          العودة إلى الأعضاء
        </Link>
      </div>
      
      <PageHeader 
        title="إضافة عضو جديد" 
        description="تسجيل عضو جديد في بيانات الجيم"
      />
      
      <div className="mt-6 max-w-2xl">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              بيانات العضو
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">الاسم الكامل *</label>
                <Input 
                  placeholder="مثال: أحمد حسن" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={errors.fullName ? "border-red-500 text-right" : "text-right"}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">رقم الهاتف *</label>
                <Input 
                  placeholder="مثال: 01012345678" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? "border-red-500 text-left font-mono" : "text-left font-mono"}
                  dir="ltr"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">البريد الإلكتروني (اختياري)</label>
                <Input 
                  type="email"
                  placeholder="مثال: ahmed@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-left font-mono"
                  dir="ltr"
                />
              </div>
              
              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/members')} disabled={loading}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading} className="min-w-32 bg-[#F97316] hover:bg-[#ea580c] text-white">
                  {loading && <Spinner className="h-4 w-4 ml-2" />}
                  {loading ? 'جاري التسجيل...' : 'تسجيل العضو'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
