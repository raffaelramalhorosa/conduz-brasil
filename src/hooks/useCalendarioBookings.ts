import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import type { BookingCalendario } from '@/components/calendario/CalendarioAulas';

function calculateEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
}

interface ScheduledSlot {
  date: string;
  time: string;
  status: string;
}

export function useCalendarioBookings(role: 'student' | 'instructor' | 'driving_school') {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingCalendario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query;

      if (role === 'student') {
        // Get student profile
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!sp) { setLoading(false); return; }

        query = supabase
          .from('bookings')
          .select(`
            id, scheduled_date, start_time, end_time, duration_hours, status,
            license_category, total_price, pickup_address, school_fee, instructor_amount,
            package_type, scheduled_slots,
            instructor_profiles!bookings_instructor_id_fkey!inner ( user_id, profiles!inner ( full_name, avatar_url ) ),
            vehicles ( brand, model )
          `)
          .eq('student_id', sp.id);
      } else {
        // Instructor or driving school — get instructor profile
        const { data: ip } = await supabase
          .from('instructor_profiles')
          .select('id, is_driving_school')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!ip) { setLoading(false); return; }

        if (role === 'driving_school' && ip.is_driving_school) {
          // Fetch own + affiliated bookings
          const [ownRes, affRes] = await Promise.all([
            supabase
              .from('bookings')
              .select(`
                id, scheduled_date, start_time, end_time, duration_hours, status,
                license_category, total_price, pickup_address, school_fee, instructor_amount,
                package_type, scheduled_slots, instructor_id,
                student_profiles!inner ( user_id ),
                instructor_profiles!bookings_instructor_id_fkey ( user_id, profiles:user_id ( full_name, avatar_url ) ),
                vehicles ( brand, model )
              `)
              .eq('instructor_id', ip.id),
            supabase
              .from('bookings')
              .select(`
                id, scheduled_date, start_time, end_time, duration_hours, status,
                license_category, total_price, pickup_address, school_fee, instructor_amount,
                package_type, scheduled_slots, instructor_id,
                student_profiles!inner ( user_id ),
                instructor_profiles!bookings_instructor_id_fkey ( user_id, profiles:user_id ( full_name, avatar_url ) ),
                vehicles ( brand, model )
              `)
              .eq('driving_school_id', ip.id)
              .neq('instructor_id', ip.id),
          ]);

          // Merge unique
          const all = [...(ownRes.data || [])];
          const ids = new Set(all.map(b => b.id));
          (affRes.data || []).forEach(b => { if (!ids.has(b.id)) all.push(b); });

          // === FETCH OTHER SCHOOL BOOKINGS (show as "Indisponível") ===
          const { data: affiliatedProfiles } = await supabase
            .from('driving_school_instructors')
            .select('linked_user_id')
            .eq('driving_school_id', ip.id)
            .in('status', ['active', 'inactive', 'removed'])
            .not('linked_user_id', 'is', null);

          if (affiliatedProfiles && affiliatedProfiles.length > 0) {
            const linkedUserIds = affiliatedProfiles.map(a => a.linked_user_id).filter(Boolean);
            const { data: instrProfiles } = await supabase
              .from('instructor_profiles')
              .select('id')
              .in('user_id', linkedUserIds as string[]);
            const instrProfileIds = instrProfiles?.map(p => p.id) || [];

            if (instrProfileIds.length > 0) {
              const { data: otherBookings } = await supabase
                .from('bookings')
                .select('id, scheduled_date, start_time, end_time, duration_hours, status, scheduled_slots, instructor_id')
                .in('instructor_id', instrProfileIds)
                .in('status', ['confirmed', 'pending'])
                .or(`driving_school_id.neq.${ip.id},driving_school_id.is.null`);

              if (otherBookings) {
                otherBookings.forEach(b => {
                  if (!ids.has(b.id)) {
                    all.push({
                      ...b,
                      total_price: null, school_fee: null, instructor_amount: null,
                      pickup_address: null, license_category: null,
                      student_profiles: null, instructor_profiles: null,
                      vehicles: null, package_type: null,
                      _isOtherSchool: true,
                    } as any);
                    ids.add(b.id);
                  }
                });
              }
            }
          }
          // === END OTHER SCHOOL BOOKINGS ===

          // Fetch student names
          const studentUserIds = [...new Set(all.map((b: any) => b.student_profiles?.user_id).filter(Boolean))] as string[];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', studentUserIds);
          const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

          // Fetch driving_school_instructors names
          const { data: dsiList } = await supabase
            .from('driving_school_instructors')
            .select('linked_user_id, name')
            .eq('driving_school_id', ip.id)
            .in('status', ['active', 'inactive', 'removed']);

          const mapped = expandBookings(all, (b: any) => {
            if (b._isOtherSchool) {
              return { studentName: 'Indisponível', isOtherSchool: true };
            }
            const studentName = nameMap.get(b.student_profiles?.user_id) || 'Aluno';
            const ip = b.instructor_profiles;
            const instrProfiles = ip?.profiles || ip?.['profiles:user_id'];
            const instructorName = instrProfiles?.full_name || undefined;
            const instructorAvatar = instrProfiles?.avatar_url || undefined;
            return { studentName, instructorName, instructorAvatar };
          });
          setBookings(mapped);
          setLoading(false);
          return;
        }

        // Regular instructor
        query = supabase
          .from('bookings')
          .select(`
            id, scheduled_date, start_time, end_time, duration_hours, status,
            license_category, total_price, pickup_address, school_fee, instructor_amount,
            package_type, scheduled_slots,
            student_profiles!inner ( user_id ),
            instructor_profiles!bookings_instructor_id_fkey!inner ( user_id, profiles!inner ( full_name, avatar_url ) ),
            vehicles ( brand, model )
          `)
          .eq('instructor_id', ip.id);
      }

      const { data, error } = await query!;
      if (error) throw error;

      if (role === 'student') {
        const mapped = expandBookings(data || [], (b: any) => ({
          studentName: undefined,
          instructorName: b.instructor_profiles?.profiles?.full_name || 'Instrutor',
          instructorAvatar: b.instructor_profiles?.profiles?.avatar_url || undefined,
        }));
        setBookings(mapped);
      } else {
        // Instructor — need student names
        const studentUserIds = [...new Set((data || []).map((b: any) => b.student_profiles?.user_id).filter(Boolean))] as string[];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentUserIds);
        const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

        const mapped = expandBookings(data || [], (b: any) => ({
          studentName: nameMap.get(b.student_profiles?.user_id) || 'Aluno',
          instructorName: undefined,
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.error('Error fetching calendar bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}

function expandBookings(
  data: any[],
  getNames: (b: any) => { studentName?: string; studentAvatar?: string; instructorName?: string; instructorAvatar?: string; isOtherSchool?: boolean }
): BookingCalendario[] {
  const result: BookingCalendario[] = [];

  for (const b of data) {
    const names = getNames(b);
    const title = names.studentName ? `Aula - ${names.studentName}` : `Aula - ${names.instructorName || ''}`;
    const subtitle = `Cat ${b.license_category || '?'}${b.total_price ? ` | R$ ${Number(b.total_price).toFixed(0)}` : ''}`;

    // Parse scheduled_slots
    let slots: ScheduledSlot[] | null = null;
    if (b.scheduled_slots) {
      if (typeof b.scheduled_slots === 'string') {
        try { slots = JSON.parse(b.scheduled_slots); } catch {}
      } else if (Array.isArray(b.scheduled_slots)) {
        slots = b.scheduled_slots;
      }
    }

    if (slots && slots.length > 1) {
      slots.forEach((slot, idx) => {
          result.push({
            id: `${b.id}_cal_${idx}`,
            title,
            subtitle: `${subtitle} (${idx + 1}/${slots!.length})`,
            date: slot.date,
            startTime: formatTimeHHMM(slot.time),
            endTime: calculateEndTime(formatTimeHHMM(slot.time), b.duration_hours || 1),
            status: slot.status === 'cancelled' ? 'cancelled' : b.status,
            color: '',
            metadata: {
              studentName: names.studentName,
              studentAvatar: names.studentAvatar,
              instructorName: names.instructorName,
              instructorAvatar: names.instructorAvatar,
              licenseCat: b.license_category,
              totalPrice: b.total_price ? Number(b.total_price) / slots!.length : undefined,
              pickupAddress: b.pickup_address,
              schoolFee: b.school_fee ? Number(b.school_fee) / slots!.length : undefined,
              instructorAmount: b.instructor_amount ? Number(b.instructor_amount) / slots!.length : undefined,
              bookingId: b.id,
              isOtherSchool: names.isOtherSchool || false,
            },
          });
      });
    } else {
      result.push({
        id: b.id,
        title,
        subtitle,
        date: b.scheduled_date,
        startTime: formatTimeHHMM(b.start_time),
        endTime: b.end_time ? formatTimeHHMM(b.end_time) : calculateEndTime(formatTimeHHMM(b.start_time), b.duration_hours || 1),
        status: b.status,
        color: '',
        metadata: {
          studentName: names.studentName,
          studentAvatar: names.studentAvatar,
          instructorName: names.instructorName,
          instructorAvatar: names.instructorAvatar,
          licenseCat: b.license_category,
          totalPrice: b.total_price ? Number(b.total_price) : undefined,
          pickupAddress: b.pickup_address,
          schoolFee: b.school_fee ? Number(b.school_fee) : undefined,
          instructorAmount: b.instructor_amount ? Number(b.instructor_amount) : undefined,
          bookingId: b.id,
          isOtherSchool: names.isOtherSchool || false,
        },
      });
    }
  }

  return result;
}
