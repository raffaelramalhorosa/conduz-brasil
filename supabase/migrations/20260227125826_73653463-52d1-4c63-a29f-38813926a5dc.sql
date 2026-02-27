-- 1) UNIQUE constraint for school+instructor pair (NULLs are treated as distinct)
ALTER TABLE driving_school_instructors
ADD CONSTRAINT unique_school_instructor 
UNIQUE (driving_school_id, linked_user_id);

-- 2) Trigger: max 3 active affiliations per instructor
CREATE OR REPLACE FUNCTION check_max_active_affiliations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.linked_user_id IS NOT NULL THEN
    IF (
      SELECT count(*) FROM driving_school_instructors 
      WHERE linked_user_id = NEW.linked_user_id 
        AND status = 'active'
        AND id != NEW.id
    ) >= 3 THEN
      RAISE EXCEPTION 'Instrutor já atingiu o limite de 3 afiliações ativas simultâneas';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_affiliations ON driving_school_instructors;
CREATE TRIGGER trg_check_max_affiliations
BEFORE INSERT OR UPDATE ON driving_school_instructors
FOR EACH ROW
EXECUTE FUNCTION check_max_active_affiliations();

-- 3) Update accept_affiliation_invitation RPC to check limit
CREATE OR REPLACE FUNCTION accept_affiliation_invitation(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.affiliation_invitations%ROWTYPE;
  v_user_id uuid;
  v_instructor_profile_id uuid;
  v_active_count integer;
BEGIN
  SELECT * INTO v_invitation FROM public.affiliation_invitations WHERE token = p_token AND status = 'pending';
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado ou já utilizado');
  END IF;
  IF v_invitation.expires_at < now() THEN
    UPDATE public.affiliation_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'Convite expirado');
  END IF;
  
  v_user_id := auth.uid();
  
  -- Check max 3 active affiliations
  SELECT count(*) INTO v_active_count
  FROM public.driving_school_instructors
  WHERE linked_user_id = v_user_id AND status = 'active';
  
  IF v_active_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já atingiu o limite de 3 afiliações ativas simultâneas. Desvincule-se de uma autoescola antes de aceitar um novo convite.');
  END IF;
  
  SELECT id INTO v_instructor_profile_id FROM public.instructor_profiles WHERE user_id = v_user_id;
  UPDATE public.affiliation_invitations SET status = 'accepted', accepted_at = now() WHERE id = v_invitation.id;
  UPDATE public.driving_school_instructors
  SET linked_user_id = v_user_id, invitation_status = 'accepted', invitation_accepted_at = now(), is_account_linked = true, status = 'active'
  WHERE driving_school_id = v_invitation.driving_school_id AND email = v_invitation.email;
  RETURN jsonb_build_object('success', true, 'message', 'Filiação aceita com sucesso');
END;
$$;