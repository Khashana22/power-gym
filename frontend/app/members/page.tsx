'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Eye, Trash2 } from 'lucide-react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardContent, Badge, Avatar, Spinner, EmptyState, ErrorState, ConfirmDialog, PageHeader, Skeleton } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import api from '../lib';

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const router = useRouter();
  const { showToast } = useToast();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await api.get<Member[]>('/members');
      setMembers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
    );
  }, [members, search]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.del(`/members/${deleteId}`);
      showToast({ title: 'تم بنجاح', message: 'تم حذف العضو بنجاح', type: 'success' });
      setMembers(members.filter(m => m.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      showToast({ title: 'خطأ', message: err.message || 'فشل في حذف العضو', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardShell title="الأعضاء">
      <PageHeader 
        title="الأعضاء" 
        description="إدارة أعضاء الجيم واشتراكاتهم"
        action={
          <Button onClick={() => router.push('/members/new')} className="gap-2 bg-[#F97316] hover:bg-[#ea580c] text-white">
            <Plus className="h-4 w-4" />
            إضافة عضو
          </Button>
        }
      />
      
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[#27272A] flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="البحث بالاسم أو الهاتف أو الكود..." 
                className="pr-9 text-right"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-zinc-400 bg-zinc-900/50 uppercase border-b border-[#27272A]">
                <tr>
                  <th className="px-6 py-4 font-medium">العضو</th>
                  <th className="px-6 py-4 font-medium">كود العضو</th>
                  <th className="px-6 py-4 font-medium">رقم الهاتف</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">تاريخ الانضمام</th>
                  <th className="px-6 py-4 font-medium text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4 flex justify-start"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8">
                      <ErrorState title="خطأ في تحميل الأعضاء" description={error} onRetry={fetchMembers} />
                    </td>
                  </tr>
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8">
                      <EmptyState 
                        title="لم يتم العثور على أعضاء" 
                        description={search ? "جرّب تعديل كلمات البحث" : "أضف أول عضو في الجيم للبدء"} 
                        action={
                          !search ? (
                            <Button onClick={() => router.push('/members/new')} variant="outline">
                              إضافة عضو
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={member.fullName.substring(0, 2).toUpperCase()} src={member.photo} />
                          <div className="font-medium text-zinc-100">{member.fullName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-300">{member.memberCode}</td>
                      <td className="px-6 py-4 text-zinc-300 font-mono" dir="ltr">{member.phone}</td>
                      <td className="px-6 py-4">
                        <Badge variant={member.isActive ? "success" : "destructive"}>
                          {member.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(member.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex justify-start gap-2">
                          <Button size="icon" variant="ghost" onClick={() => router.push(`/members/${member.id}`)} title="عرض الملف">
                            <Eye className="h-4 w-4 text-zinc-400 hover:text-white" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(member.id)} className="hover:text-red-500 hover:bg-red-500/10" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && !error && totalPages > 1 && (
            <div className="p-4 border-t border-[#27272A] flex justify-between items-center">
              <span className="text-sm text-zinc-400">
                عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filteredMembers.length)} من {filteredMembers.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف العضو"
        description="هل أنت متأكد من حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف العضو"
        confirmVariant="destructive"
        isLoading={deleting}
      />
    </DashboardShell>
  );
}
