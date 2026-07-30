'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, Calendar, CreditCard, Clock, Download, Edit, Trash2, Plus, Activity } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard-shell';
import { Card, CardHeader, CardContent, Badge, Avatar, Spinner, ErrorState, EmptyState, Modal, ConfirmDialog, Skeleton, Divider } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import api from '../../lib';

interface Member {
  id: string;
  fullName: string;
  memberCode: string;
  phone: string;
  email?: string;
  photo?: string;
  qrToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  plan: { id: string; name: string; durationDays: number; price: number };
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN';
  payments?: { id: string; amount: number; method: string; paidAt: string }[];
}

interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { showToast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{
    total: number;
    thisMonth: number;
    thisYear: number;
    lastAttendanceDate: string | null;
    lastAttendanceTime: string | null;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', email: '' });
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete confirm
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Add sub modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [memberData, subsData, plansData] = await Promise.all([
        api.get<Member>(`/members/${id}`),
        api.get<Subscription[]>(`/subscriptions/member/${id}`).catch(() => []),
        api.get<Plan[]>('/membership-plans').catch(() => [])
      ]);
      setMember(memberData);
      setSubscriptions(subsData);
      setPlans(plansData);
      setEditForm({
        fullName: memberData.fullName,
        phone: memberData.phone,
        email: memberData.email || ''
      });
      // Fetch attendance stats separately (non-blocking)
      api.get<{
        total: number;
        thisMonth: number;
        thisYear: number;
        lastAttendanceDate: string | null;
        lastAttendanceTime: string | null;
      }>(`/attendance/member/${id}/stats`)
        .then((stats) => setAttendanceStats(stats))
        .catch(() => setAttendanceStats(null));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.phone.trim()) {
      showToast({ title: 'Error', message: 'Name and phone are required', type: 'error' });
      return;
    }
    
    try {
      setEditLoading(true);
      const updated = await api.patch<Member>(`/members/${id}`, editForm);
      setMember(updated);
      setIsEditModalOpen(false);
      showToast({ title: 'Success', message: 'Member updated successfully', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to update member', type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.del(`/members/${id}`);
      showToast({ title: 'Success', message: 'Member deleted', type: 'success' });
      router.push('/members');
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to delete member', type: 'error' });
      setDeleteLoading(false);
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      showToast({ title: 'Error', message: 'Please select a plan', type: 'error' });
      return;
    }
    
    try {
      setSubLoading(true);
      const plan = plans.find(p => p.id === selectedPlan);
      const sub = await api.post<{ id: string }>('/subscriptions', { memberId: id, planId: selectedPlan });
      
      // create payment
      await api.post('/payments', { 
        subscriptionId: sub.id, 
        amount: plan?.price || 0, 
        method: paymentMethod 
      });
      
      showToast({ title: 'Success', message: 'Subscription added successfully', type: 'success' });
      setIsSubModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to add subscription', type: 'error' });
    } finally {
      setSubLoading(false);
    }
  };

  const calculateRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: string): 'success' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'danger';
      case 'FROZEN': return 'info';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Member Profile">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-1"><CardContent className="h-64"><Skeleton className="h-full w-full" /></CardContent></Card>
            <Card className="col-span-1 md:col-span-2"><CardContent className="h-64"><Skeleton className="h-full w-full" /></CardContent></Card>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !member) {
    return (
      <DashboardShell title="Member Profile">
        <div className="mb-6">
          <Link href="/members" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Members
          </Link>
        </div>
        <ErrorState title="Error Loading Profile" description={error || 'Member not found'} onRetry={fetchData} />
      </DashboardShell>
    );
  }

  // QR encodes the member code (e.g. PG-1001), NOT the UUID/qrToken
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(member.memberCode)}`;

  return (
    <DashboardShell title="Member Profile">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/members" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Members
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar src={member.photo} fallback={member.fullName.substring(0, 2).toUpperCase()} size="lg" className="w-24 h-24 text-2xl mb-4" />
                <h2 className="text-xl font-semibold text-white">{member.fullName}</h2>
                <div className="text-sm font-mono text-zinc-400 mt-1">{member.memberCode}</div>
                <Badge variant={member.isActive ? "success" : "destructive"} className="mt-3">
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Divider />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  {member.phone}
                </div>
                {member.email && (
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    {member.email}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-medium text-white">QR Code</h3>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-2 rounded-lg mb-3">
                <img src={qrUrl} alt="Member QR Code" className="w-32 h-32" />
              </div>
              <p className="text-xs text-zinc-500 font-mono mb-3">{member.memberCode}</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open(qrUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Card
              </Button>
            </CardContent>
          </Card>

          {/* Attendance Statistics */}
          <Card>
            <CardHeader>
              <h3 className="font-medium text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Attendance Stats
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {attendanceStats === null ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white">{attendanceStats.total}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Total</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white">{attendanceStats.thisMonth}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">This Month</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white">{attendanceStats.thisYear}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">This Year</p>
                    </div>
                  </div>
                  {attendanceStats.lastAttendanceDate && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last visit:{' '}
                      <span className="text-zinc-300">
                        {new Date(attendanceStats.lastAttendanceDate).toLocaleDateString()}
                        {' '}
                        {new Date(attendanceStats.lastAttendanceTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="p-6 border-b border-[#27272A] flex justify-between items-center">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscriptions
              </h3>
              <Button onClick={() => setIsSubModalOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Subscription
              </Button>
            </div>
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="p-8">
                  <EmptyState 
                    title="No subscriptions" 
                    description="This member doesn't have any subscriptions yet."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#27272A]">
                  {subscriptions.map(sub => {
                    const daysRemaining = calculateRemainingDays(sub.endDate);
                    return (
                      <div key={sub.id} className="p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-zinc-800/20 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-white">{sub.plan?.name}</h4>
                            <Badge variant={getStatusBadge(sub.status)}>{sub.status}</Badge>
                          </div>
                          <div className="text-sm text-zinc-400 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {sub.status === 'ACTIVE' && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className={daysRemaining < 7 ? "text-red-400 font-medium" : "text-zinc-300"}>
                              {daysRemaining} days remaining
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member">
        <form onSubmit={handleEdit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Full Name</label>
            <Input 
              value={editForm.fullName} 
              onChange={e => setEditForm({...editForm, fullName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Phone</label>
            <Input 
              value={editForm.phone} 
              onChange={e => setEditForm({...editForm, phone: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Email</label>
            <Input 
              value={editForm.email} 
              onChange={e => setEditForm({...editForm, email: e.target.value})}
              type="email"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button type="submit" disabled={editLoading}>
              {editLoading && <Spinner className="h-4 w-4 mr-2" />} Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Add Subscription">
        <form onSubmit={handleAddSubscription} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Membership Plan</label>
            <select 
              className="flex h-10 w-full rounded-md border border-[#27272A] bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              value={selectedPlan} 
              onChange={e => setSelectedPlan(e.target.value)}
              required
            >
              <option value="">Select a plan</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.price} EGP</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Payment Method</label>
            <select 
              className="flex h-10 w-full rounded-md border border-[#27272A] bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
              required
            >
              <option value="CASH">Cash</option>
              <option value="VISA">Visa</option>
              <option value="INSTAPAY">InstaPay</option>
              <option value="VODAFONE_CASH">Vodafone Cash</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSubModalOpen(false)} disabled={subLoading}>Cancel</Button>
            <Button type="submit" disabled={subLoading}>
              {subLoading && <Spinner className="h-4 w-4 mr-2" />} Create Subscription
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        description="Are you sure you want to delete this member? All their active subscriptions and data will be removed. This action cannot be undone."
        confirmText="Delete Member"
        confirmVariant="destructive"
        isLoading={deleteLoading}
      />
    </DashboardShell>
  );
}
