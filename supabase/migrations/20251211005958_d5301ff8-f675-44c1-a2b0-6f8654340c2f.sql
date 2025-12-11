-- Função para calcular estatísticas do instrutor
CREATE OR REPLACE FUNCTION get_instructor_stats(p_instructor_id UUID)
RETURNS TABLE (
  total_accepted INTEGER,
  total_rejected INTEGER,
  total_completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER as total_accepted,
    COUNT(*) FILTER (WHERE status IN ('cancelled_by_instructor', 'rejected'))::INTEGER as total_rejected,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as total_completed
  FROM bookings
  WHERE instructor_id = p_instructor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;