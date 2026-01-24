-- Add vehicle linking capability to driving school instructors
ALTER TABLE public.driving_school_instructors 
ADD COLUMN linked_vehicle_ids uuid[] DEFAULT '{}';

-- Add index for faster queries on vehicle lookups
CREATE INDEX idx_driving_school_instructors_linked_vehicles 
ON public.driving_school_instructors USING GIN (linked_vehicle_ids);

-- Comment for documentation
COMMENT ON COLUMN public.driving_school_instructors.linked_vehicle_ids 
IS 'Array of vehicle IDs that this instructor is allowed to use for lessons';