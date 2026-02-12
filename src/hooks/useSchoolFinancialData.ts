import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, format } from 'date-fns';

export interface InstructorFinancialRow {
  instructorDsiId: string;
  instructorName: string;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalSchoolFees: number;
  totalInstructorPay: number;
  avgClassPrice: number;
  commissionRate: number;
  fixedFee: number;
}

export type PeriodPreset = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'custom';

export function useSchoolFinancialData() {
  const { profile } = useAuth();
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('month');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  useEffect(() => {
    const fetchId = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (data) setInstructorProfileId(data.id);
    };
    fetchId();
  }, [profile?.id]);

  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    switch (periodPreset) {
      case 'today':
        return { dateFrom: startOfDay(now), dateTo: endOfDay(now) };
      case 'week':
        return { dateFrom: startOfWeek(now, { weekStartsOn: 1 }), dateTo: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
      case 'last_month': {
        const last = subMonths(now, 1);
        return { dateFrom: startOfMonth(last), dateTo: endOfMonth(last) };
      }
      case 'year':
        return { dateFrom: new Date(now.getFullYear(), 0, 1), dateTo: new Date(now.getFullYear(), 11, 31) };
      case 'custom':
        return { dateFrom: customDateFrom || startOfMonth(now), dateTo: customDateTo || endOfMonth(now) };
      default:
        return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
    }
  }, [periodPreset, customDateFrom, customDateTo]);

  const { data: instructorRows, isLoading, refetch } = useQuery({
    queryKey: ['school-financial', instructorProfileId, format(dateFrom, 'yyyy-MM-dd'), format(dateTo, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!instructorProfileId) return [];
      const { data, error } = await supabase.rpc('get_school_financial_summary', {
        p_school_instructor_profile_id: instructorProfileId,
        p_date_from: format(dateFrom, 'yyyy-MM-dd'),
        p_date_to: format(dateTo, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return (data || []).map((r): InstructorFinancialRow => ({
        instructorDsiId: r.instructor_dsi_id,
        instructorName: r.instructor_name,
        totalBookings: r.total_bookings,
        completedBookings: r.completed_bookings,
        totalRevenue: r.total_revenue,
        totalSchoolFees: r.total_school_fees,
        totalInstructorPay: r.total_instructor_pay,
        avgClassPrice: r.avg_class_price,
        commissionRate: r.commission_rate,
        fixedFee: r.fixed_fee,
      }));
    },
    enabled: !!instructorProfileId,
  });

  // Fetch bookings for chart data grouped by date
  const { data: chartData } = useQuery({
    queryKey: ['school-financial-chart', instructorProfileId, format(dateFrom, 'yyyy-MM-dd'), format(dateTo, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!instructorProfileId) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('scheduled_date, total_price, school_fee')
        .eq('driving_school_id', instructorProfileId)
        .eq('status', 'completed')
        .gte('scheduled_date', format(dateFrom, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateTo, 'yyyy-MM-dd'))
        .order('scheduled_date');
      if (error) throw error;
      // Group by date
      const grouped: Record<string, { date: string; revenue: number; commission: number }> = {};
      (data || []).forEach(b => {
        const d = b.scheduled_date;
        if (!grouped[d]) grouped[d] = { date: d, revenue: 0, commission: 0 };
        grouped[d].revenue += Number(b.total_price) || 0;
        grouped[d].commission += Number(b.school_fee) || 0;
      });
      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!instructorProfileId,
  });

  const totals = useMemo(() => {
    const rows = instructorRows || [];
    return {
      totalRevenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
      totalSchoolFees: rows.reduce((s, r) => s + r.totalSchoolFees, 0),
      totalInstructorPay: rows.reduce((s, r) => s + r.totalInstructorPay, 0),
      totalBookings: rows.reduce((s, r) => s + r.totalBookings, 0),
      completedBookings: rows.reduce((s, r) => s + r.completedBookings, 0),
    };
  }, [instructorRows]);

  return {
    instructorRows: instructorRows || [],
    chartData: chartData || [],
    totals,
    isLoading,
    refetch,
    instructorProfileId,
    periodPreset,
    setPeriodPreset,
    dateFrom,
    dateTo,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
  };
}
