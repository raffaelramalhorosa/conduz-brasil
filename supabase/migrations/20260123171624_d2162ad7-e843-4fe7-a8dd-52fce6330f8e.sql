-- Add package booking support to bookings table
-- Using a single record with array of scheduled dates approach

-- Add new columns for package bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS package_lessons_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS scheduled_slots JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS package_price NUMERIC DEFAULT NULL;

-- Add constraint to validate package_type
ALTER TABLE public.bookings 
ADD CONSTRAINT check_package_type 
CHECK (package_type IN ('single', 'package_5', 'package_10', 'package_20'));

-- Add check for lessons count matching package type
CREATE OR REPLACE FUNCTION validate_package_lessons()
RETURNS TRIGGER AS $$
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

CREATE TRIGGER trigger_validate_package_lessons
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION validate_package_lessons();

-- Add completed_lessons_count to track progress
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS completed_lessons_count INTEGER DEFAULT 0;

-- Comment the new columns
COMMENT ON COLUMN public.bookings.package_type IS 'Type of booking: single, package_5, package_10, package_20';
COMMENT ON COLUMN public.bookings.package_lessons_count IS 'Number of lessons in the package';
COMMENT ON COLUMN public.bookings.scheduled_slots IS 'JSON array of {date, time, status} for each lesson slot';
COMMENT ON COLUMN public.bookings.package_price IS 'Total package price (discounted)';
COMMENT ON COLUMN public.bookings.completed_lessons_count IS 'Number of lessons already completed in this package';