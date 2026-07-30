'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
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
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid Egyptian mobile number';
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
      showToast({ title: 'Success', message: 'Member created successfully', type: 'success' });
      router.push(`/members/${data.id}`);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to create member', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="New Member">
      <div className="mb-6">
        <Link href="/members" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Members
        </Link>
      </div>
      
      <PageHeader 
        title="Add New Member" 
        description="Register a new member to the gym"
      />
      
      <div className="mt-6 max-w-2xl">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Member Details
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Full Name *</label>
                <Input 
                  placeholder="e.g. Ahmed Hassan" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Phone Number *</label>
                <Input 
                  placeholder="e.g. 01012345678" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Email (Optional)</label>
                <Input 
                  type="email"
                  placeholder="e.g. ahmed@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push('/members')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="min-w-32">
                  {loading && <Spinner className="h-4 w-4 mr-2" />}
                  {loading ? 'Creating...' : 'Create Member'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
