
CREATE OR REPLACE FUNCTION public.update_affiliated_vehicle(
  p_vehicle_id uuid,
  p_brand text DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_license_plate text DEFAULT NULL,
  p_color text DEFAULT NULL,
  p_vehicle_type text DEFAULT NULL,
  p_license_category text DEFAULT NULL,
  p_transmission text DEFAULT NULL,
  p_has_air_conditioning boolean DEFAULT NULL,
  p_has_power_steering boolean DEFAULT NULL,
  p_is_adapted boolean DEFAULT NULL,
  p_adaptation_type text DEFAULT NULL,
  p_main_photo_url text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_profile_id uuid;
  v_is_affiliated boolean := false;
BEGIN
  SELECT id INTO v_school_profile_id 
  FROM instructor_profiles 
  WHERE user_id = auth.uid() AND is_driving_school = true
  LIMIT 1;

  IF v_school_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não é uma autoescola');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM vehicles v
    JOIN instructor_profiles ip ON ip.id = v.instructor_id
    JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
    WHERE v.id = p_vehicle_id
      AND dsi.driving_school_id = v_school_profile_id
      AND dsi.status = 'active'
      AND dsi.is_account_linked = true
  ) INTO v_is_affiliated;

  IF NOT v_is_affiliated THEN
    RETURN json_build_object('success', false, 'error', 'Veículo não pertence a um filiado desta autoescola');
  END IF;

  UPDATE vehicles SET
    brand = COALESCE(p_brand, brand),
    model = COALESCE(p_model, model),
    year = COALESCE(p_year, year),
    license_plate = COALESCE(p_license_plate, license_plate),
    color = COALESCE(p_color, color),
    vehicle_type = COALESCE(p_vehicle_type, vehicle_type),
    license_category = COALESCE(p_license_category, license_category),
    transmission = COALESCE(p_transmission, transmission),
    has_air_conditioning = COALESCE(p_has_air_conditioning, has_air_conditioning),
    has_power_steering = COALESCE(p_has_power_steering, has_power_steering),
    is_adapted = COALESCE(p_is_adapted, is_adapted),
    adaptation_type = COALESCE(p_adaptation_type, adaptation_type),
    main_photo_url = COALESCE(p_main_photo_url, main_photo_url),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_vehicle_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_affiliated_vehicle TO authenticated;
