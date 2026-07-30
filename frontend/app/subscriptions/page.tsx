'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Spinner, EmptyState, ErrorState, Modal, PageHeader, Avatar, Skeleton } from '../components/ui';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/input';
import { DashboardShell } from '../components/dashboard-shell';
import { useToast } from '../components/ui/toast';
import { RefreshCw, CreditCard } from 'lucide-react';
import api from '../lib';
import Link from 'next/link';

interface Member {
  id: string;
  fullName: string;
  phone: string;
  memberCode: string;
  photo?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN';
  plan: Plan;
  member: Member;
}

const STATUS_BADGE: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'neutral'> = {
  ACTIVE: 'success', EXPIRED: 'danger', FROZEN: 'info',
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'VISA', label: 'Visa' },
  { value: 'INSTAPAY', label: 'Instapay' },
  { value: 'VODAFONE_CASH', label: 'Vodafone Cash' },
];

function fmt(n: number) { return 'EGP ' + new Intl.NumberFormat('en-EG').format(n); }

function remainingDays(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'ACTIVE' | 'EXPIRED' | 'FROZEN'>('All');

  const [renewModal, setRenewModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewAmount, setRenewAmount] = useState('');
  const [renewMethod, setRenewMethod] = useState('CASH');
  const [isRenewing, setIsRenewing] = useState(false);

  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [membersData, plansData] = await Promise.all([
        api.get<Member[]>('/members'),
        api.get<Plan[]>('/membership-plans'),
      ]);
      setPlans(plansData.filter(p => (p as any).isActive !== false));

      // Fetch each member's latest subscription in parallel (up to 30)
      const subsResults = await Promise.all(
        membersData.slice(0, 30).map(async m => {
          try {
            const subs = await api.get<any[]>(`/subscriptions/member/${m.id}`);
            if (subs?.length > 0) {
              const latest = [...subs].sort((a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
              )[0];
              return { ...latest, member: m };
            }
          } catch { /* ignore */ }
          return null;
        })
      );

      setSubscriptions(subsResults.filter(Boolean) as Subscription[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openRenew = (sub: Subscription) => {
    setSelectedSub(sub);
    setRenewPlanId(sub.plan.id);
    setRenewAmount(String(sub.plan.price));
    setRenewMethod('CASH');
    setRenewModal(true);
  };

  const handleRenew = async () => {
    if (!selectedSub || !renewPlanId) return;
    setIsRenewing(true);
    try {
      const newSub = await api.post<any>('/subscriptions', {
        memberId: selectedSub.member.id,
        planId: renewPlanId,
      });
      const amount = parseFloat(renewAmount);
      if (amount > 0) {
        await api.post('/payments', { subscriptionId: newSub.id, amount, method: renewMethod });
      }
      showToast({ title: 'Subscription renewed', type: 'success' });
      setRenewModal(false);
      fetchData();
    } catch (err: any) {
      showToast({ title: 'Failed to renew', message: err.message, type: 'error' });
    } finally {
      setIsRenewing(false);
    }
  };

  const filtered = filter === 'All' ? subscriptions : subscriptions.filter(s => s.status === filter);
  const filterOptions: ('All' | 'ACTIVE' | 'EXPIRED' | 'FROZEN')[] = ['All', 'ACTIVE', 'EXPIRED', 'FROZEN'];

  return (
    <DashboardShell title="Subscriptions">
      <PageHeader title="Subscriptions" description="Monitor member subscriptions and manage renewals" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#F97316] text-white'
                : 'text-[#71717A] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            {f !== 'All' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({subscriptions.filter(s => s.status === f).length})
              </span>
            )}
          </button>
        ))}
        <button
          onClick={fetchData}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#71717A] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-10 h-10" />} title="No subscriptions found" description="Subscriptions will appear here once members sign up for plans." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#71717A] uppercase border-b border-[#27272A] bg-[#0F0F11]">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Start</th>
                  <th className="px-5 py-3 font-medium">End</th>
                  <th className="px-5 py-3 font-medium">Remaining</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {filtered.map(sub => {
                  const days = remainingDays(sub.endDate);
                  return (
                    <tr key={sub.id} className="hover:bg-[#1F1F23] transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/members/${sub.member.id}`} className="flex items-center gap-2 hover:text-[#F97316] transition-colors">
                          <Avatar name={sub.member.fullName} photo={sub.member.photo} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-[#FAFAFA]">{sub.member.fullName}</p>
                            <p className="text-xs text-[#71717A]">{sub.member.memberCode}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#A1A1AA]">{sub.plan?.name}</td>
                      <td className="px-5 py-3 text-[#A1A1AA]">{new Date(sub.startDate).toLocaleDateString('en-EG')}</td>
                      <td className="px-5 py-3 text-[#A1A1AA]">{new Date(sub.endDate).toLocaleDateString('en-EG')}</td>
                      <td className="px-5 py-3">
                        {sub.status === 'EXPIRED' ? (
                          <span className="text-[#EF4444] text-xs">Expired</span>
                        ) : (
                          <span className={`text-sm font-medium ${days <= 3 ? 'text-[#EF4444]' : days <= 7 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                            {days}d
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_BADGE[sub.status] || 'neutral'}>{sub.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => openRenew(sub)} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                          Renew
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Renew Modal */}
      <Modal
        open={renewModal}
        onClose={() => setRenewModal(false)}
        title={`Renew: ${selectedSub?.member.fullName}`}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Select Plan"
            required
            value={renewPlanId}
            onChange={e => {
              setRenewPlanId(e.target.value);
              const p = plans.find(p => p.id === e.target.value);
              if (p) setRenewAmount(String(p.price));
            }}
            options={plans.map(p => ({ value: p.id, label: `${p.name} — ${fmt(p.price)} / ${p.durationDays}d` }))}
            placeholder="Choose plan..."
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#A1A1AA]">Amount (EGP) <span className="text-[#EF4444]">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={renewAmount}
              onChange={e => setRenewAmount(e.target.value)}
              className="w-full h-10 rounded-lg bg-[#18181B] border border-[#27272A] text-[#FAFAFA] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <Select
            label="Payment Method"
            value={renewMethod}
            onChange={e => setRenewMethod(e.target.value)}
            options={PAYMENT_METHODS}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setRenewModal(false)}>Cancel</Button>
            <Button loading={isRenewing} onClick={handleRenew} disabled={!renewPlanId}>
              Confirm Renewal
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
