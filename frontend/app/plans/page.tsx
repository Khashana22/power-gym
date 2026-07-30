'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Badge, Spinner, EmptyState, ErrorState, Modal, ConfirmDialog, PageHeader, Skeleton } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DashboardShell } from '../components/dashboard-shell';
import { useToast } from '../components/ui/toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib';

interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  isActive: boolean;
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

  const { toast } = useToast();

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Plan[]>('/membership-plans');
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatDuration = (days: number) => {
    if (days % 30 === 0) {
      const months = days / 30;
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const handleOpenModal = (plan?: Plan) => {
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
    setIsSaving(true);
    try {
      if (selectedPlan) {
        await api.patch(`/membership-plans/${selectedPlan.id}`, formData);
        toast({ title: 'Success', description: 'Plan updated successfully' });
      } else {
        await api.post('/membership-plans', formData);
        toast({ title: 'Success', description: 'Plan created successfully' });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save plan', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/membership-plans/${plan.id}`, { isActive: !plan.isActive });
      toast({ title: 'Success', description: `Plan ${!plan.isActive ? 'activated' : 'deactivated'}` });
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to update plan status', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    try {
      await api.del(`/membership-plans/${selectedPlan.id}`);
      toast({ title: 'Success', description: 'Plan deleted successfully' });
      setIsConfirmOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete plan', variant: 'destructive' });
    }
  };

  return (
    <DashboardShell title="Membership Plans">
      <PageHeader 
        title="Membership Plans" 
        description="Manage gym membership plans and pricing"
        action={
          <Button onClick={() => handleOpenModal()} className="bg-[#F97316] hover:bg-[#F97316]/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl bg-[#18181B]" />)}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load plans" description={error} onRetry={fetchPlans} />
      ) : plans.length === 0 ? (
        <EmptyState 
          icon={<Plus className="h-8 w-8 text-zinc-500" />} 
          title="No membership plans" 
          description="Create your first membership plan to get started." 
          action={<Button onClick={() => handleOpenModal()}>Create Plan</Button>} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {plans.map(plan => (
            <Card key={plan.id} className="bg-[#18181B] border-[#27272A] hover:border-[#F97316]/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <h3 className="font-semibold text-lg text-white">{plan.name}</h3>
                <Badge variant={plan.isActive ? 'success' : 'secondary'} onClick={() => handleToggleActive(plan)} className="cursor-pointer">
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-white">{plan.price} EGP</span>
                  <span className="text-zinc-400 text-sm ml-2">/ {formatDuration(plan.durationDays)}</span>
                </div>
                <div className="flex gap-2 pt-4 border-t border-[#27272A]">
                  <Button variant="outline" size="sm" className="flex-1 border-[#27272A] hover:bg-zinc-800" onClick={() => handleOpenModal(plan)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => { setSelectedPlan(plan); setIsConfirmOpen(true); }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title={selectedPlan ? 'Edit Plan' : 'Create Plan'}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Plan Name</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Monthly Pro" className="bg-[#09090B] border-[#27272A]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Duration (Days)</label>
            <Input type="number" min="1" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: parseInt(e.target.value) || 0})} className="bg-[#09090B] border-[#27272A]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Price (EGP)</label>
            <Input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} className="bg-[#09090B] border-[#27272A]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.name || formData.durationDays < 1 || formData.price < 0} className="bg-[#F97316] hover:bg-[#F97316]/90 text-white">
            {isSaving ? <Spinner className="mr-2" /> : null} Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog 
        open={isConfirmOpen} 
        onOpenChange={setIsConfirmOpen}
        title="Delete Plan" 
        description={`Are you sure you want to delete ${selectedPlan?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
