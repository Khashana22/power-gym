'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardContent } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import api from '../lib';
import {
  BarChart3, Users, Calendar, Download, FileText,
  TrendingUp, RefreshCw, ArrowUpRight, CreditCard,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

interface RevenueReport {
  total: number;
  chart: { date: string; amount: number }[];
  byMethod: Record<string, number>;
}

interface AttendanceReport {
  total: number;
  uniqueMembers: number;
  chart: { date: string; count: number }[];
}

interface MembersReport {
  newMembers: { id: string; fullName: string; memberCode: string; createdAt: string }[];
  totalActive: number;
  expiringSoon: number;
  expiringThisMonth: number;
}

function StatCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#09090B] p-5 rounded-xl border border-[#27272A]">
      <p className="text-zinc-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'attendance' | 'members'>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [membersData, setMembersData] = useState<MembersReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchReports = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const params = `startDate=${startDate}&endDate=${endDate}`;
      const [rev, att, mem] = await Promise.all([
        api.get<RevenueReport>(`/reports/revenue?${params}`),
        api.get<AttendanceReport>(`/reports/attendance?${params}`),
        api.get<MembersReport>(`/reports/members?${params}`),
      ]);
      setRevenueData(rev);
      setAttendanceData(att);
      setMembersData(mem);
    } catch {
      toast({ title: 'Error', description: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) fetchReports();
  }, []); // initial load

  const handleExport = async (type: 'pdf' | 'excel', dataset: 'revenue' | 'attendance') => {
    const params = `startDate=${startDate}&endDate=${endDate}`;
    const ext = type === 'pdf' ? 'pdf' : 'xlsx';
    const url = type === 'pdf'
      ? `/reports/export/${dataset}/pdf?${params}`
      : `/reports/export/${dataset}/excel?${params}`;

    try {
      // Navigate to the backend export URL directly (triggers download)
      window.open(`http://localhost:3001${url}`, '_blank');
    } catch {
      toast({ title: 'Export failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const revenueChart = (revenueData?.chart || []).map((d) => ({
    ...d,
    date: formatDate(d.date),
    amount: Math.round(d.amount),
  }));

  const attendanceChart = (attendanceData?.chart || []).map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <DashboardShell title="Reports & Analytics">
      <div className="space-y-6">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#18181B] p-4 rounded-xl border border-[#27272A]">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#09090B] border-[#27272A] text-white w-36"
            />
            <span className="text-zinc-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#09090B] border-[#27272A] text-white w-36"
            />
            <Button
              className="bg-[#F97316] hover:bg-[#ea580c] text-white"
              onClick={fetchReports}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading…' : 'Update'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf', activeTab === 'attendance' ? 'attendance' : 'revenue')}
              className="border-[#27272A] text-white hover:bg-[#27272A]"
            >
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel', activeTab === 'attendance' ? 'attendance' : 'revenue')}
              className="border-[#27272A] text-white hover:bg-[#27272A]"
            >
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#27272A]">
          {([
            { key: 'revenue', icon: TrendingUp, label: 'Revenue' },
            { key: 'attendance', icon: Calendar, label: 'Attendance' },
            { key: 'members', icon: Users, label: 'Members' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(key)}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue"
                value={`${(revenueData?.total || 0).toLocaleString()} EGP`}
                color="text-[#F97316]"
              />
              <StatCard
                label="Avg. Daily"
                value={`${Math.round((revenueData?.total || 0) / Math.max(revenueChart.length, 1)).toLocaleString()} EGP`}
              />
              {Object.entries(revenueData?.byMethod || {}).slice(0, 2).map(([method, amount]) => (
                <StatCard key={method} label={method.replace('_', ' ')} value={`${(amount as number).toLocaleString()} EGP`} />
              ))}
            </div>

            <Card className="border-[#27272A] bg-[#18181B]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-[#F97316]" />
                  Daily Revenue Trend
                </h3>
                {revenueChart.length > 0 ? (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                        <XAxis dataKey="date" stroke="#71717A" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#71717A" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#fff' }}
                          itemStyle={{ color: '#F97316' }}
                          formatter={(v: any) => [`${Number(v).toLocaleString()} EGP`, 'Revenue']}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#F97316' }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500">
                    {loading ? 'Loading chart…' : 'No revenue data for this period'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Method breakdown */}
            {revenueData?.byMethod && Object.keys(revenueData.byMethod).length > 0 && (
              <Card className="border-[#27272A] bg-[#18181B]">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#F97316]" /> Revenue by Payment Method
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(revenueData.byMethod).map(([method, amount]) => {
                      const pct = Math.round(((amount as number) / revenueData.total) * 100);
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-300">{method.replace('_', ' ')}</span>
                            <span className="text-white font-medium">{(amount as number).toLocaleString()} EGP ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#F97316] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Check-ins" value={(attendanceData?.total || 0).toLocaleString()} color="text-blue-400" />
              <StatCard label="Unique Members" value={(attendanceData?.uniqueMembers || 0).toLocaleString()} />
              <StatCard
                label="Avg. Daily"
                value={Math.round((attendanceData?.total || 0) / Math.max(attendanceChart.length, 1)).toLocaleString()}
              />
            </div>

            <Card className="border-[#27272A] bg-[#18181B]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Daily Attendance
                </h3>
                {attendanceChart.length > 0 ? (
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717A" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#71717A" tick={{ fontSize: 12 }} />
                        <Tooltip
                          cursor={{ fill: '#27272A' }}
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#fff' }}
                          formatter={(v: any) => [v, 'Check-ins']}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500">
                    {loading ? 'Loading chart…' : 'No attendance data for this period'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Active" value={(membersData?.totalActive || 0).toLocaleString()} color="text-green-400" />
              <StatCard label="New This Period" value={(membersData?.newMembers?.length || 0).toLocaleString()} color="text-[#F97316]" />
              <StatCard label="Expiring in 7 Days" value={(membersData?.expiringSoon || 0).toLocaleString()} color="text-yellow-400" />
              <StatCard label="Expiring This Month" value={(membersData?.expiringThisMonth || 0).toLocaleString()} />
            </div>

            {(membersData?.newMembers || []).length > 0 && (
              <Card className="border-[#27272A] bg-[#18181B]">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-white mb-4">
                    New Members ({membersData!.newMembers.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-zinc-500 border-b border-[#27272A]">
                          <th className="text-left py-2 pr-4">Code</th>
                          <th className="text-left py-2 pr-4">Name</th>
                          <th className="text-left py-2 pr-4">Phone</th>
                          <th className="text-left py-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membersData!.newMembers.map((m) => (
                          <tr key={m.id} className="border-b border-[#27272A]/50 hover:bg-[#27272A]/30 transition-colors">
                            <td className="py-2.5 pr-4 text-[#F97316] font-mono text-xs">{m.memberCode}</td>
                            <td className="py-2.5 pr-4 text-white">{m.fullName}</td>
                            <td className="py-2.5 pr-4 text-zinc-400">{(m as any).phone}</td>
                            <td className="py-2.5 text-zinc-400">
                              {new Date(m.createdAt).toLocaleDateString('en-EG')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
