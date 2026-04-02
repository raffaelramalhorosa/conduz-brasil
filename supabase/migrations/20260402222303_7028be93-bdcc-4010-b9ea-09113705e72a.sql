CREATE OR REPLACE FUNCTION public.rollback_withdrawal(
  p_owner_id uuid,
  p_amount_cents bigint,
  p_withdrawal_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Re-credit the available_balance
  UPDATE wallet_balances
  SET available_balance = available_balance + p_amount_cents,
      total_withdrawn = GREATEST(total_withdrawn - p_amount_cents, 0)
  WHERE owner_id = p_owner_id;

  -- Mark withdrawal as failed
  UPDATE withdrawals
  SET status = 'failed'
  WHERE id = p_withdrawal_id;
END;
$$;