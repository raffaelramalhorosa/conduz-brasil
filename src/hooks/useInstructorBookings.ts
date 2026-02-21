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
      // Get instructor profile id and check if driving school
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

      // Fetch own bookings
      const ownBookingsPromise = supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles!vehicle_id (
            id,
            brand,
            model,
            license_plate,
            transmission
          )
        `)
        .eq('instructor_id', instructorProfile.id)
        .order('requested_at', { ascending: false });

      // For driving schools, also fetch affiliated bookings
      const affiliatedBookingsPromise = instructorProfile.is_driving_school
        ? supabase
            .from('bookings')
            .select(`
              *,
              vehicle:vehicles!vehicle_id (
                id,
                brand,
                model,
                license_plate,
                transmission
              )
            `)
            .eq('driving_school_id', instructorProfile.id)
            .neq('instructor_id', instructorProfile.id)
            .order('requested_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [ownResult, affiliatedResult] = await Promise.all([
        ownBookingsPromise,
        affiliatedBookingsPromise,
      ]);

      if (ownResult.error) throw ownResult.error;

      // Merge bookings, avoiding duplicates
      const allBookingsData = [...(ownResult.data || [])];
      if (affiliatedResult.data) {
        const existingIds = new Set(allBookingsData.map(b => b.id));
        affiliatedResult.data.forEach(b => {
          if (!existingIds.has(b.id)) {
            allBookingsData.push(b);
          }
        });
      }

      // Fetch student details for each booking
      const enrichedBookings = await Promise.all(
        (allBookingsData || []).map(async (booking) => {
          // Get student profile
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('id, user_id')
            .eq('id', booking.student_id)
            .maybeSingle();

          let studentInfo = {
            id: booking.student_id,
            user_id: '',
            full_name: 'Aluno',
            avatar_url: null,
            phone: null,
            previous_classes: 0,
            average_rating: null as number | null,
          };

          if (studentProfile) {
            // Get profile details
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, phone')
              .eq('id', studentProfile.user_id)
              .maybeSingle();

            if (profile) {
              studentInfo = {
                ...studentInfo,
                user_id: studentProfile.user_id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                phone: profile.phone,
              };
            }

            // Get previous classes count with this instructor
            const { count: previousClasses } = await supabase
              .from('bookings')
              .select('id', { count: 'exact', head: true })
              .eq('student_id', booking.student_id)
              .eq('instructor_id', instructorProfile.id)
              .eq('status', 'completed');

            studentInfo.previous_classes = previousClasses || 0;
          }

          // Get instructor profile info (for driving school view)
          let instructorInfo: { full_name: string; avatar_url: string | null } | null = null;
          if (instructorProfile.is_driving_school && booking.instructor_id !== instructorProfile.id) {
            const { data: instrProfile } = await supabase
              .from('instructor_profiles')
              .select('user_id')
              .eq('id', booking.instructor_id)
              .maybeSingle();
            if (instrProfile) {
              const { data: instrUserProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', instrProfile.user_id)
                .maybeSingle();
              if (instrUserProfile) {
                instructorInfo = instrUserProfile;
              }
            }
          }

          return {
            ...booking,
            student: studentInfo,
            instructor: instructorInfo,
          };
        })
      );

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
          
          if (payload.eventType === 'INSERT') {
            toast.info('Nova solicitação de aula!', {
              description: 'Confira na aba de pendentes',
              duration: 10000,
            });
          }
          
          // Refresh bookings
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

  // Mark a confirmed booking as completed
  const completeBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const realBookingId = getRealBookingId(bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', realBookingId);

      if (error) throw error;

      toast.success('Aula marcada como concluída!');
      await fetchBookings();
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Erro ao concluir aula');
      return false;
    }
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
