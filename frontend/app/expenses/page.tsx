'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardHeader, CardContent, PageHeader, Badge, EmptyState, ErrorState, Modal, ConfirmDialog, Skeleton } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input, Select, Textarea } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import { Plus, Trash2, Receipt, TrendingDown, Filter } from 'lucide-react';
import api from '../lib';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'RENT',        label: 'Rent' },
  { value: 'UTILITIES',   label: 'Utilities' },
  { value: 'SALARIES',    label: 'Salaries' },
  { value: 'EQUIPMENT',   label: 'Equipment' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MARKETING',   label: 'Marketing' },
  { value: 'SUPPLIES',    label: 'Supplies' },
  { value: 'OTHER',       label: 'Other' },
];

const CAT_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'primary' | 'neutral'> = {
  RENT: 'danger', UTILITIES: 'warning', SALARIES: 'danger',
  EQUIPMENT: 'info', MAINTENANCE: 'warning', MARKETING: 'primary',
  SUPPLIES: 'neutral', OTHER: 'neutral',
};

function fmt(n: number) {
  return 'EGP ' + new Intl.NumberFormat('en-EG').format(n);
}

const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', amount: '', notes: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Expense[]>(`/expenses?month=${month}`);
      setExpenses(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.category) errs.category = 'Category is required';
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        notes: form.notes.trim() || undefined,
      };
      const created = await api.post<Expense>('/expenses', body);
      setExpenses(prev => [created, ...prev]);
      setModalOpen(false);
      setForm({ title: '', category: '', amount: '', notes: '' });
      setFormErrors({});
      showToast({ title: 'Expense added', type: 'success' });
    } catch (e: any) {
      showToast({ title: 'Failed to save', message: e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.del(`/expenses/${deleteId}`);
      setExpenses(prev => prev.filter(e => e.id !== deleteId));
      setDeleteId(null);
      showToast({ title: 'Expense deleted', type: 'success' });
    } catch (e: any) {
      showToast({ title: 'Failed to delete', message: e.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Group by category for summary
  const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <DashboardShell title="Expenses">
      <PageHeader
        title="Expenses"
        description="Track and manage gym operational costs"
        action={
          <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#18181B] border border-[#EF444430] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EF444420] flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-xs text-[#71717A] uppercase tracking-wide">Total This Month</p>
            <p className="text-xl font-bold text-[#FAFAFA]">{fmt(totalAmount)}</p>
          </div>
        </div>
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#27272A] flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#A1A1AA]" />
          </div>
          <div>
            <p className="text-xs text-[#71717A] uppercase tracking-wide">Transactions</p>
            <p className="text-xl font-bold text-[#FAFAFA]">{expenses.length}</p>
          </div>
        </div>
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F9731615] flex items-center justify-center">
            <Filter className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <p className="text-xs text-[#71717A] uppercase tracking-wide">Month Filter</p>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#FAFAFA] focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Expense Records</h3>
              <span className="text-xs text-[#71717A]">{month}</span>
            </CardHeader>
            <div className="divide-y divide-[#27272A]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))
              ) : error ? (
                <div className="py-8"><ErrorState message={error} onRetry={fetchExpenses} /></div>
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-10 h-10" />}
                  title="No expenses this month"
                  description="Add expenses to track your gym's operational costs."
                  action={<Button onClick={() => setModalOpen(true)} variant="outline" size="sm">Add First Expense</Button>}
                />
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="px-5 py-4 flex items-center gap-3 hover:bg-[#1F1F23] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#EF444415] flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-[#EF4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#FAFAFA] truncate">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={CAT_BADGE[exp.category] || 'neutral'}>
                          {CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                        </Badge>
                        <span className="text-xs text-[#71717A]">
                          {new Date(exp.createdAt).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {exp.notes && <p className="text-xs text-[#71717A] mt-0.5 truncate">{exp.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-[#EF4444]">{fmt(exp.amount)}</span>
                      <button
                        onClick={() => setDeleteId(exp.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF444415] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Category breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-[#FAFAFA]">By Category</h3></CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(byCat).length === 0 ? (
                <p className="text-sm text-[#71717A] text-center py-4">No data</p>
              ) : (
                Object.entries(byCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#A1A1AA]">{CATEGORIES.find(c => c.value === cat)?.label || cat}</span>
                        <span className="text-[#FAFAFA] font-medium">{fmt(amt)}</span>
                      </div>
                      <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#EF4444] rounded-full"
                          style={{ width: `${Math.round((amt / totalAmount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setFormErrors({}); }} title="Add Expense" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Monthly rent"
            error={formErrors.title}
          />
          <Select
            label="Category"
            required
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            options={CATEGORIES}
            placeholder="Select category"
            error={formErrors.category}
          />
          <Input
            label="Amount (EGP)"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
            error={formErrors.amount}
          />
          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional details..."
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save Expense</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleting}
      />
    </DashboardShell>
  );
}
