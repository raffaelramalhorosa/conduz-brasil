
DROP FUNCTION IF EXISTS public.get_school_balance(uuid);

CREATE FUNCTION public.get_school_balance(p_school_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'available_balance', COALESCE((
      SELECT SUM(net_amount) FROM transactions
      WHERE driving_school_id = p_school_id
        AND status = 'available'
    ), 0),
    'pending_balance', COALESCE((
      SELECT SUM(net_amount) FROM transactions
      WHERE driving_school_id = p_school_id
        AND status = 'pending'
    ), 0),
    'total_withdrawn', COALESCE((
      SELECT SUM(net_amount) FROM transactions
      WHERE driving_school_id = p_school_id
        AND status = 'withdrawn'
    ), 0)
  );
$$;
