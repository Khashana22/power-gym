'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge, EmptyState, ErrorState, Modal, ConfirmDialog, PageHeader, Skeleton } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DashboardShell } from '../components/dashboard-shell';
import { useToast } from '../components/ui/toast';
import { Plus, Edit, Trash2, Package, Clock, DollarSign } from 'lucide-react';
import api from '../lib';

interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat('ar-EG').format(n) + ' ج.م';
}

function formatDuration(days: number) {
  if (days === 365) return 'سنة كاملة';
  if (days === 30) return 'شهر واحد';
  if (days === 60) return 'شهران';
  if (days % 30 === 0) { const m = days / 30; return `${m} أشهر`; }
  if (days === 7) return 'أسبوع';
  if (days % 7 === 0) { const w = days / 7; return `${w} أسابيع`; }
  return `${days} يوم`;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ name: '', durationDays: 30, price: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Plan[]>('/membership-plans');
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل خطط العضوية');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openModal = (plan?: Plan) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({ name: plan.name, durationDays: plan.durationDays, price: plan.price });
    } else {
      setSelectedPlan(null);
      setFormData({ name: '', durationDays: 30, price: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { showToast({ title: 'اسم الخطة مطلوب', type: 'warning' }); return; }
    if (formData.durationDays < 1) { showToast({ title: 'يجب أن تكون المدة يوماً واحداً على الأقل', type: 'warning' }); return; }
    if (formData.price < 0) { showToast({ title: 'لا يمكن أن يكون السعر بالسالب', type: 'warning' }); return; }

    setIsSaving(true);
    try {
      if (selectedPlan) {
        const updated = await api.patch<Plan>(`/membership-plans/${selectedPlan.id}`, formData);
        setPlans(ps => ps.map(p => p.id === updated.id ? updated : p));
        showToast({ title: 'تم تحديث الخطة بنجاح', type: 'success' });
      } else {
        const created = await api.post<Plan>('/membership-plans', formData);
        setPlans(ps => [...ps, created]);
        showToast({ title: 'تم إنشاء الخطة بنجاح', type: 'success' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast({ title: 'فشل حفظ الخطة', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (plan: Plan) => { setSelectedPlan(plan); setIsConfirmOpen(true); };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setIsDeleting(true);
    try {
      await api.del(`/membership-plans/${selectedPlan.id}`);
      setPlans(ps => ps.filter(p => p.id !== selectedPlan.id));
      showToast({ title: 'تم حذف الخطة بنجاح', type: 'success' });
      setIsConfirmOpen(false);
    } catch (err: any) {
      showToast({ title: 'فشل حذف الخطة', message: err.message, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardShell title="خطط العضوية والاشتراكات">
      <PageHeader
        title="خطط وباقات العضوية"
        description="إدارة عروض واشتراكات الجيم وتحديد أسعارها بالجنيه المصري"
        action={
          <Button onClick={() => openModal()} icon={<Plus className="w-4 h-4" />}>
            خطة جديدة
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPlans} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="لا توجد خطط عضوية حتى الآن"
          description="أضف باقات الاشتراكات لتتمكن من تسجيل وتجديد اشتراكات الأعضاء."
          action={<Button onClick={() => openModal()} icon={<Plus className="w-4 h-4" />}>إضافة أول خطة</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
          {plans.map(plan => (
            <div key={plan.id} className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 flex flex-col gap-4 hover:border-[#3F3F46] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#F9731615] border border-[#F9731630] flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-[#F97316]" />
                </div>
                <Badge variant={plan.isActive ? 'success' : 'neutral'}>
                  {plan.isActive ? 'مفعلة' : 'غير نشطة'}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#FAFAFA]">{plan.name}</h3>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(plan.durationDays)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#F97316] font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>{fmt(plan.price)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-[#27272A]">
                <Button variant="ghost" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openModal(plan)} className="flex-1">
                  تعديل
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => confirmDelete(plan)} className="flex-1 hover:text-[#EF4444] hover:bg-[#EF444415]">
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlan ? 'تعديل خطة العضوية' : 'خطة عضوية جديدة'}
        size="sm"
      >
        <div className="space-y-4 text-right">
          <Input
            label="اسم الخطة أو الباقة"
            required
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder="مثال: اشتراك شهري VIP، باقة 3 شهور"
          />
          <Input
            label="المدة (بالأيام)"
            type="number"
            min="1"
            required
            value={formData.durationDays}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, durationDays: parseInt(e.target.value) || 1 }))}
            hint="30 = شهر، 90 = 3 شهور، 180 = 6 شهور، 365 = سنة"
          />
          <Input
            label="السعر (بالجنيه المصري)"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
          <div className="flex gap-2 justify-start pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            <Button loading={isSaving} onClick={handleSave}>
              {selectedPlan ? 'حفظ التعديلات' : 'إنشاء الخطة'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="تأكيد حذف الخطة"
        description={`هل أنت متأكد من حذف باقة "${selectedPlan?.name}"؟ لن يؤثر هذا على الاشتراكات السارية حالياً.`}
        confirmText="تأكيد الحذف"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </DashboardShell>
  );
}
