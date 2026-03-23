import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatBookingDate } from '@/lib/addressFormatter';

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + durationHours;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

interface ScheduledSlot {
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface BookingWithDetails {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  license_category: string;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  total_price: number;
  platform_fee: number;
  instructor_amount: number;
  student_message: string | null;
  instructor_message: string | null;
  status: string;
  requested_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  // Package booking fields
  package_type?: string | null;
  package_lessons_count?: number | null;
  scheduled_slots?: ScheduledSlot[] | null;
  slotIndex?: number;
  totalSlots?: number;
  originalBookingId?: string;
  // Affiliation fields
  is_affiliated_booking?: boolean;
  driving_school_id?: string | null;
  driving_school_instructor_id?: string | null;
  school_fee?: number | null;
  school_fee_rate?: number | null;
  school_fee_type?: string | null;
  accepted_by_school_at?: string | null;
  payment_status?: string | null;
  // Instructor info (for driving school view)
  instructor_id?: string;
  instructor?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  student: {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    previous_classes: number;
    average_rating: number | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    license_plate: string;
    transmission: string;
  };
}

export function useInstructorBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. Get instructor profile
      const { data: instructorProfile, error: profileError } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!instructorProfile) {
        setLoading(false);
        return;
      }

      setInstructorProfileId(instructorProfile.id);

      // 2. Single query with nested joins — replaces all N+1 queries per booking
      const nestedSelect = `
        *,
        vehicle:vehicles!vehicle_id (
          id, brand, model, license_plate, transmission
        ),
        student_profile:student_profiles!student_id (
          id, user_id,
          profile:profiles!user_id (full_name, avatar_url, phone)
        ),
        instructor_profile:instructor_profiles!instructor_id (
          id, user_id,
          profile:profiles!user_id (full_name, avatar_url)
        )
      `;

      const ownBookingsQuery = supabase
        .from('bookings')
        .select(nestedSelect)
        .eq('instructor_id', instructorProfile.id)
        .order('requested_at', { ascending: false });

      const ownBookingsPromise = !instructorProfile.is_driving_school
        ? ownBookingsQuery.is('driving_school_id', null)
        : ownBookingsQuery;

      const affiliatedBookingsPromise = instructorProfile.is_driving_school
        ? supabase
            .from('bookings')
            .select(nestedSelect)
            .eq('driving_school_id', instructorProfile.id)
            .neq('instructor_id', instructorProfile.id)
            .order('requested_at', { ascending: false })
        : Promise.resolve({ data: [] as any[], error: null });

      const [ownResult, affiliatedResult] = await Promise.all([
        ownBookingsPromise,
        affiliatedBookingsPromise,
      ]);

      if (ownResult.error) throw ownResult.error;

      // Merge without duplicates
      const allBookingsData = [...(ownResult.data || [])];
      if (affiliatedResult.data) {
        const existingIds = new Set(allBookingsData.map(b => b.id));
        affiliatedResult.data.forEach(b => {
          if (!existingIds.has(b.id)) allBookingsData.push(b);
        });
      }

      // 3. Batch previous_classes count — ONE query instead of N count queries
      const studentIds = [...new Set(allBookingsData.map(b => b.student_id).filter(Boolean))];
      const prevClassesMap = new Map<string, number>();
      if (studentIds.length > 0) {
        const { data: completedRows } = await supabase
          .from('bookings')
          .select('student_id')
          .eq('instructor_id', instructorProfile.id)
          .eq('status', 'completed')
          .in('student_id', studentIds);

        completedRows?.forEach(row => {
          prevClassesMap.set(row.student_id, (prevClassesMap.get(row.student_id) || 0) + 1);
        });
      }

      // 4. Map nested data to BookingWithDetails shape
      const enrichedBookings = allBookingsData.map((booking: any) => {
        const sp = booking.student_profile;
        const studentProfileData = sp?.profile;
        const ip = booking.instructor_profile;
        const instructorProfileData = ip?.profile;

        const studentInfo = {
          id: booking.student_id,
          user_id: sp?.user_id || '',
          full_name: studentProfileData?.full_name || 'Aluno',
          avatar_url: studentProfileData?.avatar_url || null,
          phone: studentProfileData?.phone || null,
          previous_classes: prevClassesMap.get(booking.student_id) || 0,
          average_rating: null as number | null,
        };

        const instructorInfo =
          instructorProfile.is_driving_school &&
          booking.instructor_id !== instructorProfile.id &&
          instructorProfileData
            ? { full_name: instructorProfileData.full_name, avatar_url: instructorProfileData.avatar_url }
            : null;

        return {
          ...booking,
          student: studentInfo,
          instructor: instructorInfo,
          vehicle: booking.vehicle,
        };
      });

      // Expand package bookings into individual lesson cards
      const expandedBookings: BookingWithDetails[] = [];
      
      for (const booking of enrichedBookings) {
        // Parse scheduled_slots - may come as string or array from Supabase
        let scheduledSlots: ScheduledSlot[] | null = null;
        
        if (booking.scheduled_slots) {
          if (typeof booking.scheduled_slots === 'string') {
            try {
              scheduledSlots = JSON.parse(booking.scheduled_slots);
            } catch (e) {
              console.error('Error parsing scheduled_slots:', e);
            }
          } else if (Array.isArray(booking.scheduled_slots)) {
            scheduledSlots = booking.scheduled_slots as unknown as ScheduledSlot[];
          }
        }
        
        // Check if it's a package with multiple slots
        if (scheduledSlots && Array.isArray(scheduledSlots) && scheduledSlots.length > 1) {
          // Expand each slot into its own card
          scheduledSlots.forEach((slot, index) => {
            // Map slot status to expanded booking status
            let slotStatus = booking.status;
            if (slot.status === 'completed') {
              slotStatus = 'completed';
            } else if (slot.status === 'cancelled') {
              slotStatus = 'cancelled_by_instructor';
            }

            const expandedLesson = {
              ...booking,
              originalBookingId: booking.id,
              id: `${booking.id}-slot-${index}`,
              scheduled_date: slot.date,
              start_time: slot.time,
              end_time: calculateEndTime(slot.time, booking.duration_hours || 1),
              slotIndex: index + 1,
              totalSlots: scheduledSlots!.length,
              scheduled_slots: scheduledSlots,
              status: slotStatus,
            } as unknown as BookingWithDetails;
            expandedBookings.push(expandedLesson);
          });
        } else {
          // Single lesson - add as-is
          expandedBookings.push(booking as unknown as BookingWithDetails);
        }
      }

      // Sort by date
      expandedBookings.sort((a, b) => {
        const dateA = new Date(a.scheduled_date);
        const dateB = new Date(b.scheduled_date);
        return dateA.getTime() - dateB.getTime();
      });

      setBookings(expandedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time subscription
  useEffect(() => {
    if (!instructorProfileId) return;

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `instructor_id=eq.${instructorProfileId}`,
        },
        (payload) => {
          console.log('Booking change received:', payload);

          if (payload.eventType === 'UPDATE') {
            // Patch only the changed booking in state — no refetch needed
            setBookings(prev =>
              prev.map(b => {
                const dbId = b.originalBookingId || b.id;
                if (dbId !== payload.new.id) return b;
                return {
                  ...b,
                  status: payload.new.status ?? b.status,
                  confirmed_at: payload.new.confirmed_at ?? b.confirmed_at,
                  cancelled_at: payload.new.cancelled_at ?? b.cancelled_at,
                  cancellation_reason: payload.new.cancellation_reason ?? b.cancellation_reason,
                  instructor_message: payload.new.instructor_message ?? b.instructor_message,
                  scheduled_slots: payload.new.scheduled_slots ?? b.scheduled_slots,
                  completed_lessons_count: payload.new.completed_lessons_count ?? b.completed_lessons_count,
                  payment_status: payload.new.payment_status ?? b.payment_status,
                };
              })
            );
            return;
          }

          if (payload.eventType === 'DELETE') {
            setBookings(prev =>
              prev.filter(b => (b.originalBookingId || b.id) !== payload.old.id)
            );
            return;
          }

          // INSERT — full refetch to get enriched nested data
          toast.info('Nova solicitação de aula!', {
            description: 'Confira na aba de pendentes',
            duration: 10000,
          });
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorProfileId, fetchBookings]);

  // Helper to get the real database booking ID (for package slots)
  const getRealBookingId = (bookingId: string): string => {
    // Check if this is an expanded slot ID (contains "-slot-")
    if (bookingId.includes('-slot-')) {
      // Find the booking to get the original ID
      const booking = bookings.find(b => b.id === bookingId);
      if (booking?.originalBookingId) {
        return booking.originalBookingId;
      }
      // Fallback: extract ID before "-slot-"
      return bookingId.split('-slot-')[0];
    }
    return bookingId;
  };

  const confirmBooking = async (
    bookingId: string,
    message?: string
  ): Promise<boolean> => {
    try {
      const realBookingId = getRealBookingId(bookingId);
      const bookingToConfirm = bookings.find(b => b.id === bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          instructor_message: message || null,
        })
        .eq('id', realBookingId);

      if (error) throw error;

      // Update acceptance rate
      if (instructorProfileId) {
        await updateAcceptanceRate(instructorProfileId, true);
      }

      // Send confirmation email to student
      if (bookingToConfirm && bookingToConfirm.student.user_id) {
        try {
          const { data: instructorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single();

          const { data: studentData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', bookingToConfirm.student.user_id)
            .single();

          if (studentData?.email && instructorData?.full_name) {
            const formattedDate = formatBookingDate(bookingToConfirm.scheduled_date).toLocaleDateString('pt-BR');

            await supabase.functions.invoke('notify-booking-confirmed', {
              body: {
                bookingId: realBookingId,
                studentEmail: studentData.email,
                studentName: bookingToConfirm.student.full_name,
                instructorName: instructorData.full_name,
                scheduledDate: formattedDate,
                startTime: bookingToConfirm.start_time,
                pickupAddress: bookingToConfirm.pickup_address,
                vehicleInfo: bookingToConfirm.vehicle ? `${bookingToConfirm.vehicle.brand} ${bookingToConfirm.vehicle.model}` : undefined,
                message,
              },
            });
          }
        } catch (notifyError) {
          console.error('Error sending confirmation notification:', notifyError);
        }
      }

      toast.success('Aula confirmada! O aluno foi notificado.');
      await fetchBookings();
      return true;
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Erro ao confirmar agendamento');
      return false;
    }
  };

  const rejectBooking = async (
    bookingId: string,
    reason: string,
    message?: string
  ): Promise<boolean> => {
    try {
      const realBookingId = getRealBookingId(bookingId);
      // Get the booking details before updating
      const bookingToReject = bookings.find(b => b.id === bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled_by_instructor',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          instructor_message: message || null,
        })
        .eq('id', realBookingId);

      if (error) throw error;

      // Update acceptance rate
      if (instructorProfileId) {
        await updateAcceptanceRate(instructorProfileId, false);
      }

      // Send notification to student
      if (bookingToReject && bookingToReject.student.user_id) {
        try {
          // Get instructor name
          const { data: instructorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single();

          // Get student email
          const { data: studentData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', bookingToReject.student.user_id)
            .single();

          if (studentData?.email && instructorData?.full_name) {
            // Format date for email - use formatBookingDate to avoid timezone issues
            const formattedDate = formatBookingDate(bookingToReject.scheduled_date).toLocaleDateString('pt-BR');

            await supabase.functions.invoke('notify-booking-rejected', {
              body: {
                bookingId: realBookingId,
                studentEmail: studentData.email,
                studentName: bookingToReject.student.full_name,
                instructorName: instructorData.full_name,
                scheduledDate: formattedDate,
                startTime: bookingToReject.start_time,
                reason,
                message,
              },
            });
          }
        } catch (notifyError) {
          console.error('Error sending rejection notification:', notifyError);
          // Don't fail the rejection if notification fails
        }
      }

      toast.success('Solicitação recusada. O aluno foi notificado.');
      await fetchBookings();
      return true;
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Erro ao recusar agendamento');
      return false;
    }
  };

  // Cancel a confirmed booking (used from details modal)
  const cancelBooking = async (
    bookingId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const realBookingId = getRealBookingId(bookingId);
      const bookingToCancel = bookings.find(b => b.id === bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled_by_instructor',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', realBookingId);

      if (error) throw error;

      // Send cancellation email to student
      if (bookingToCancel && bookingToCancel.student.user_id) {
        try {
          const { data: instructorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single();

          const { data: studentData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', bookingToCancel.student.user_id)
            .single();

          if (studentData?.email && instructorData?.full_name) {
            const formattedDate = formatBookingDate(bookingToCancel.scheduled_date).toLocaleDateString('pt-BR');

            await supabase.functions.invoke('notify-booking-cancelled', {
              body: {
                bookingId: realBookingId,
                recipientEmail: studentData.email,
                recipientName: bookingToCancel.student.full_name,
                cancelledBy: 'instructor',
                cancellerName: instructorData.full_name,
                scheduledDate: formattedDate,
                startTime: bookingToCancel.start_time,
                reason,
              },
            });
          }
        } catch (notifyError) {
          console.error('Error sending cancellation notification:', notifyError);
        }
      }

      toast.success('Aula cancelada com sucesso. O aluno foi notificado.');
      await fetchBookings();
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Erro ao cancelar agendamento');
      return false;
    }
  };

  // Mark a confirmed booking (or a single slot within a package) as completed
  const completeBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const realBookingId = getRealBookingId(bookingId);
      const isSlot = bookingId.includes('-slot-');
      const bookingToComplete = bookings.find(b => b.id === bookingId);

      if (isSlot) {
        // Extract slot index from the expanded ID
        const slotIndex = parseInt(bookingId.split('-slot-')[1], 10);

        // Fetch current booking data to get scheduled_slots
        const { data: currentBooking, error: fetchError } = await supabase
          .from('bookings')
          .select('scheduled_slots, completed_lessons_count, package_lessons_count, is_affiliated_booking, driving_school_id')
          .eq('id', realBookingId)
          .single();

        if (fetchError || !currentBooking) throw fetchError || new Error('Booking not found');

        const slots: ScheduledSlot[] = (currentBooking.scheduled_slots as unknown as ScheduledSlot[]) || [];

        if (slotIndex < 0 || slotIndex >= slots.length) {
          toast.error('Slot inválido');
          return false;
        }

        if (slots[slotIndex].status === 'completed') {
          toast.error('Esta aula já foi concluída');
          return false;
        }

        // Mark only the specific slot as completed
        slots[slotIndex] = { ...slots[slotIndex], status: 'completed' };

        const newCompletedCount = (currentBooking.completed_lessons_count || 0) + 1;
        const totalLessons = currentBooking.package_lessons_count || slots.length;
        const allCompleted = newCompletedCount >= totalLessons;

        const updateData: Record<string, unknown> = {
          scheduled_slots: slots,
          completed_lessons_count: newCompletedCount,
        };

        // Only mark the entire booking as completed if ALL slots are done
        if (allCompleted) {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', realBookingId);

        if (error) throw error;

        // Notify school for affiliated booking
        try {
          await notifySchoolOnCompletion(currentBooking, bookingToComplete, realBookingId);
        } catch (e) {
          console.error('Falha ao notificar autoescola:', e);
        }

        toast.success(
          allCompleted
            ? 'Todas as aulas do pacote foram concluídas!'
            : 'Aula marcada como concluída!'
        );
      } else {
        // Single lesson booking — mark as completed directly
        const { data: completedBooking, error } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', realBookingId)
          .select('is_affiliated_booking, driving_school_id')
          .single();

        if (error) throw error;

        // Notify school for affiliated booking
        try {
          await notifySchoolOnCompletion(completedBooking, bookingToComplete, realBookingId);
        } catch (e) {
          console.error('Falha ao notificar autoescola:', e);
        }

        toast.success('Aula marcada como concluída!');
      }

      await fetchBookings();
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Erro ao concluir aula');
      return false;
    }
  };

  // Helper to notify driving school when an affiliated lesson is completed
  const notifySchoolOnCompletion = async (
    bookingData: { is_affiliated_booking?: boolean | null; driving_school_id?: string | null },
    bookingDetails: BookingWithDetails | undefined,
    bookingId: string
  ) => {
    if (!bookingData.is_affiliated_booking || !bookingData.driving_school_id) return;

    const { data: schoolProfile } = await supabase
      .from('instructor_profiles')
      .select('user_id')
      .eq('id', bookingData.driving_school_id)
      .single();

    if (!schoolProfile) return;

    // Get instructor name
    const { data: instructorData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .single();

    const instructorName = instructorData?.full_name || 'Instrutor';
    const studentName = bookingDetails?.student?.full_name || 'Aluno';

    await supabase.from('notifications').insert({
      user_id: schoolProfile.user_id,
      type: 'affiliated_lesson_completed',
      title: 'Aula concluída pelo instrutor',
      message: `${instructorName} concluiu a aula com ${studentName}.`,
      booking_id: bookingId,
      action_url: '/admin/agendamentos',
    });
  };

  const updateAcceptanceRate = async (
    instructorId: string,
    accepted: boolean
  ) => {
    try {
      const { data: stats } = await supabase.rpc('get_instructor_stats', {
        p_instructor_id: instructorId,
      });

      if (stats && stats.length > 0) {
        const { total_accepted = 0, total_rejected = 0 } = stats[0];
        const totalRequests = total_accepted + total_rejected + 1;
        const totalAccepted = total_accepted + (accepted ? 1 : 0);
        const newRate = (totalAccepted / totalRequests) * 100;

        await supabase
          .from('instructor_profiles')
          .update({ acceptance_rate: newRate })
          .eq('id', instructorId);
      }
    } catch (error) {
      console.error('Error updating acceptance rate:', error);
    }
  };

  const filterByStatus = (status: string) => {
    // Handle 'cancelled' as a group of all cancellation statuses
    if (status === 'cancelled') {
      return bookings.filter((b) => 
        b.status === 'cancelled_by_instructor' || 
        b.status === 'cancelled_by_student' ||
        b.status === 'no_show_student' ||
        b.status === 'no_show_instructor'
      );
    }
    // No-show filter for instructor absences
    if (status === 'no_show') {
      return bookings.filter((b) => (b as any).instructor_no_show === true);
    }
    return bookings.filter((b) => b.status === status);
  };

  const checkScheduleConflict = (booking: BookingWithDetails): boolean => {
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    
    return confirmedBookings.some((confirmed) => {
      if (confirmed.scheduled_date !== booking.scheduled_date) return false;
      if (confirmed.id === booking.id) return false;

      const parseTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const bookingStart = parseTime(booking.start_time);
      const bookingEnd = parseTime(booking.end_time);
      const confirmedStart = parseTime(confirmed.start_time);
      const confirmedEnd = parseTime(confirmed.end_time);

      return (
        (bookingStart >= confirmedStart && bookingStart < confirmedEnd) ||
        (bookingEnd > confirmedStart && bookingEnd <= confirmedEnd) ||
        (bookingStart <= confirmedStart && bookingEnd >= confirmedEnd)
      );
    });
  };

  return {
    bookings,
    loading,
    fetchBookings,
    confirmBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
    filterByStatus,
    checkScheduleConflict,
    pendingCount: filterByStatus('pending').length,
    confirmedCount: filterByStatus('confirmed').length,
  };
}
