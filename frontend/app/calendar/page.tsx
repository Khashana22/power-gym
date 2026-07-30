'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '../components/dashboard-shell';
import { Card } from '../components/ui';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, Users } from 'lucide-react';
import api from '../lib';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCells = () => {
    const cells = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 border border-[#27272A]/50 bg-[#09090B]/50 p-2"></div>);
    }
    
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isCurrentMonth && today.getDate() === d;
      
      cells.push(
        <div key={d} className={`h-32 border border-[#27272A] p-2 flex flex-col transition-colors hover:bg-[#27272A]/30 ${isToday ? 'bg-[#F97316]/10 border-[#F97316]/50' : 'bg-[#18181B]'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-[#F97316] text-white' : 'text-zinc-300'}`}>
              {d}
            </span>
          </div>
          
          {isToday && stats && (
            <div className="mt-auto space-y-1">
              <div className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> ${stats.revenue}
              </div>
              <div className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                <Users className="w-3 h-3" /> {stats.todayAttendance}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return cells;
  };

  return (
    <DashboardShell title="Calendar">
      <Card className="border-[#27272A] bg-[#18181B] overflow-hidden">
        
        <div className="p-6 border-b border-[#27272A] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white w-48">
              {monthNames[month]} {year}
            </h2>
            <div className="flex bg-[#09090B] rounded-lg border border-[#27272A] overflow-hidden">
              <button onClick={prevMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-[#27272A] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#27272A] border-x border-[#27272A] transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-[#27272A] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Revenue
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Attendance
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-medium text-zinc-500 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-[#27272A] rounded-xl overflow-hidden border border-[#27272A]">
            {renderCells()}
          </div>
        </div>

      </Card>
    </DashboardShell>
  );
}
