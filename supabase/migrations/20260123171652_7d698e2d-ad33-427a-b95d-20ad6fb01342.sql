-- Fix security warnings: set search_path for validate_package_lessons function
CREATE OR REPLACE FUNCTION validate_package_lessons()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.package_type = 'single' AND NEW.package_lessons_count != 1 THEN
    RAISE EXCEPTION 'Single lessons must have lessons_count = 1';
  END IF;
  
  IF NEW.package_type = 'package_5' AND NEW.package_lessons_count != 5 THEN
    RAISE EXCEPTION 'Package 5 must have lessons_count = 5';
  END IF;
  
  IF NEW.package_type = 'package_10' AND NEW.package_lessons_count != 10 THEN
    RAISE EXCEPTION 'Package 10 must have lessons_count = 10';
  END IF;
  
  IF NEW.package_type = 'package_20' AND NEW.package_lessons_count != 20 THEN
    RAISE EXCEPTION 'Package 20 must have lessons_count = 20';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;