'use client';

import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardHeader, CardContent } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';
import { Info, Smartphone, Building, Code2, Save } from 'lucide-react';
import { useToast } from '../components/ui/toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم حفظ التعديلات بنجاح.',
    });
  };

  return (
    <DashboardShell title="الإعدادات">
      <div className="max-w-4xl space-y-8">
        
        {/* Gym Information */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F97316]/10 rounded-lg">
                <Building className="w-5 h-5 text-[#F97316]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">معلومات الجيم</h3>
                <p className="text-sm text-zinc-400">إدارة بيانات الجيم والمالك</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">اسم الجيم</label>
                <Input defaultValue="POWER GYM" className="bg-[#09090B] border-[#27272A]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">اسم المالك</label>
                <Input defaultValue="محمد موسى" className="bg-[#09090B] border-[#27272A]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">رقم الهاتف</label>
                <Input defaultValue="01559666564" className="bg-[#09090B] border-[#27272A] font-mono" dir="ltr" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-300">العنوان</label>
                <Textarea defaultValue="123 Fitness Street" className="bg-[#09090B] border-[#27272A] min-h-[100px]" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                <Save className="w-4 h-4 ml-2" /> حفظ التعديلات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">تكامل واتساب (WhatsApp)</h3>
                <p className="text-sm text-zinc-400">إعداد الرسائل التلقائية عبر واتساب Cloud API</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-4 items-start">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200 leading-relaxed">
                هذه الإعدادات تتطلب حساب Meta Developer وتطبيق WhatsApp Business مُعد. 
                البيانات مشفرة ومحفوظة بأمان في متغيرات البيئة.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">رمز واتساب (Token)</label>
                <Input 
                  type="password" 
                  defaultValue="*************************" 
                  className="bg-[#09090B] border-[#27272A] font-mono" 
                  disabled
                />
                <p className="text-xs text-zinc-500">تم الإعداد عبر متغير البيئة WHATSAPP_TOKEN</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">معرف رقم الهاتف (Phone Number ID)</label>
                <Input 
                  defaultValue="Configured via Env" 
                  className="bg-[#09090B] border-[#27272A] font-mono" 
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About App */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Code2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">عن النظام</h3>
                <p className="text-sm text-zinc-400">معلومات النظام والمالك والمطور</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 mb-1">اسم التطبيق</p>
                  <p className="font-medium text-white">POWER GYM</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">المالك</p>
                  <p className="font-bold text-[#F97316]">محمد موسى</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">الإصدار</p>
                  <p className="font-medium text-white bg-zinc-800 inline-block px-2 py-0.5 rounded text-xs border border-zinc-700">1.0.0</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 mb-1">المطور</p>
                  <p className="font-medium text-white">Sayed Khashana</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">هاتف الدعم والاستفسارات</p>
                  <p className="font-medium text-white font-mono" dir="ltr">01559666564</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#27272A]">
              <p className="text-zinc-400 text-sm text-center">
                نظام إدارة الجيم الاحترافي POWER GYM. جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}
