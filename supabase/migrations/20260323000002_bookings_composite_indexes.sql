-- Indexes to speed up instructor bookings queries
-- idx_bookings_instructor_status: main filter for fetchBookings (instructor_id + status)
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_status
  ON public.bookings (instructor_id, status);

-- idx_bookings_school_status: main filter for affiliated/driving-school bookings
CREATE INDEX IF NOT EXISTS idx_bookings_school_status
  ON public.bookings (driving_school_id, status);

-- idx_bookings_student_instructor_completed: batch previous_classes count query
CREATE INDEX IF NOT EXISTS idx_bookings_student_instructor_completed
  ON public.bookings (student_id, instructor_id)
  WHERE status = 'completed';
