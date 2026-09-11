'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Badge, Spinner, EmptyState, Modal, PageHeader } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DashboardShell } from '../components/dashboard-shell';
import { useToast } from '../components/ui/toast';
import { CreditCard, Search, DollarSign } from 'lucide-react';
import api from '../lib';

interface Member {
  id: string;
  fullName: string;
  phone: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  subscriptionId: string;
}

export default function PaymentsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ subscriptionId: '', amount: 0, method: 'CASH' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    api.get<Member[]>('/members').then(setMembers).catch(console.error);
  }, []);

  const loadMemberDetails = async (member: Member) => {
    setSelectedMember(member);
    setIsLoading(true);
    try {
      const subs = await api.get<any[]>(`/subscriptions/member/${member.id}`);
      setSubscriptions(subs || []);
      
      const allPayments: Payment[] = [];
      for (const sub of (subs || [])) {
        const subPayments = await api.get<Payment[]>(`/payments/subscription/${sub.id}`);
        allPayments.push(...(subPayments || []));
      }
      
      setPayments(allPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()));
    } catch (err: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل مدفوعات العضو', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentData.subscriptionId) return;
    setIsSubmitting(true);
    try {
      await api.post('/payments', paymentData);
      toast({ title: 'تم بنجاح', description: 'تم تسجيل الدفعة بنجاح' });
      setIsRecordModalOpen(false);
      if (selectedMember) loadMemberDetails(selectedMember);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message || 'فشل في تسجيل الدفعة', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch(method) {
      case 'CASH': return 'warning';
      case 'VISA': return 'default';
      case 'INSTAPAY': return 'secondary';
      case 'VODAFONE_CASH': return 'destructive';
      default: return 'outline';
    }
  };

  const getMethodName = (method: string) => {
    switch(method) {
      case 'CASH': return 'كاش';
      case 'VISA': return 'فيزا';
      case 'INSTAPAY': return 'إنستاباي';
      case 'VODAFONE_CASH': return 'فودافون كاش';
      default: return method;
    }
  };

  const filteredMembers = members.filter(m => (m.fullName ?? "").toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search));

  return (
    <DashboardShell title="المدفوعات">
      <PageHeader 
        title="المدفوعات" 
        description="عرض وتسجيل مدفوعات الأعضاء"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="bg-[#18181B] border-[#27272A] md:col-span-1 flex flex-col h-[600px]">
          <CardHeader className="pb-3 border-b border-[#27272A]">
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="البحث عن عضو..." 
                className="pr-9 text-right bg-[#09090B] border-[#27272A]"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {filteredMembers.map(member => (
              <div 
                key={member.id} 
                className={`p-4 border-b border-[#27272A] cursor-pointer hover:bg-zinc-800 transition-colors ${selectedMember?.id === member.id ? 'bg-zinc-800 border-r-2 border-r-[#F97316]' : ''}`}
                onClick={() => loadMemberDetails(member)}
              >
                <div className="font-medium text-white">{member.fullName}</div>
                <div className="text-sm text-zinc-500 font-mono" dir="ltr">{member.phone}</div>
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-sm">لم يتم العثور على أعضاء</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#18181B] border-[#27272A] md:col-span-2 h-[600px] flex flex-col">
          {!selectedMember ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <CreditCard className="h-12 w-12 mb-4 opacity-20" />
              <p>اختر عضواً لعرض سجل مدفوعاته</p>
            </div>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#27272A] pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">مدفوعات {selectedMember.fullName}</h3>
                  <p className="text-sm text-zinc-400">سجل المعاملات والمدفوعات</p>
                </div>
                <Button onClick={() => {
                  setPaymentData({ subscriptionId: subscriptions[0]?.id || '', amount: 0, method: 'CASH' });
                  setIsRecordModalOpen(true);
                }} className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                  <DollarSign className="ml-2 h-4 w-4" /> تسجيل دفعة
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-12"><Spinner className="h-8 w-8 text-[#F97316]" /></div>
                ) : payments.length === 0 ? (
                  <EmptyState icon={<CreditCard className="h-8 w-8 text-zinc-500" />} title="لا توجد مدفوعات مسجلة" description="هذا العضو ليس لديه مدفوعات مسجلة حتى الآن." />
                ) : (
                  <table className="w-full text-sm text-right text-zinc-300">
                    <thead className="bg-[#09090B] text-zinc-400 border-b border-[#27272A]">
                      <tr>
                        <th className="px-6 py-3">التاريخ</th>
                        <th className="px-6 py-3">المبلغ</th>
                        <th className="px-6 py-3">طريقة الدفع</th>
                        <th className="px-6 py-3">فترة الاشتراك</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => {
                        const sub = subscriptions.find(s => s.id === payment.subscriptionId);
                        return (
                          <tr key={payment.id} className="border-b border-[#27272A] hover:bg-zinc-800/50">
                            <td className="px-6 py-4">{new Date(payment.paidAt).toLocaleDateString('ar-EG')}</td>
                            <td className="px-6 py-4 font-bold text-white">{payment.amount} ج.م</td>
                            <td className="px-6 py-4">
                              <Badge variant={getMethodColor(payment.method)}>{getMethodName(payment.method)}</Badge>
                            </td>
                            <td className="px-6 py-4 text-zinc-400 text-xs">
                              {sub ? `${new Date(sub.startDate).toLocaleDateString('ar-EG')} إلى ${new Date(sub.endDate).toLocaleDateString('ar-EG')}` : 'غير معروف'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Modal open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen} title={`تسجيل دفعة لـ ${selectedMember?.fullName}`}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">اختر الاشتراك</label>
            <select 
              className="flex h-10 w-full rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              value={paymentData.subscriptionId} 
              onChange={e => setPaymentData({...paymentData, subscriptionId: e.target.value})}
            >
              <option value="" disabled>اختر اشتراكاً...</option>
              {subscriptions.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.startDate).toLocaleDateString('ar-EG')} إلى {new Date(s.endDate).toLocaleDateString('ar-EG')} - {s.plan?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">المبلغ (ج.م)</label>
            <Input type="number" min="0" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})} className="bg-[#09090B] border-[#27272A] text-left font-mono" dir="ltr" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">طريقة الدفع</label>
            <select 
              className="flex h-10 w-full rounded-md border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              value={paymentData.method} 
              onChange={e => setPaymentData({...paymentData, method: e.target.value})}
            >
              <option value="CASH">كاش (نقدي)</option>
              <option value="VISA">فيزا / بطاقة بنكية</option>
              <option value="INSTAPAY">إنستاباي (InstaPay)</option>
              <option value="VODAFONE_CASH">فودافون كاش (Vodafone Cash)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsRecordModalOpen(false)}>إلغاء</Button>
          <Button onClick={handleRecordPayment} disabled={isSubmitting || !paymentData.subscriptionId || paymentData.amount <= 0} className="bg-[#F97316] hover:bg-[#ea580c] text-white">
            {isSubmitting ? <Spinner className="ml-2" /> : null} تسجيل الدفعة
          </Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}
