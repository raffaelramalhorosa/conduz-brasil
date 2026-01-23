-- Add public read policy for active driving school instructors
-- This allows students/visitors to see the instructors on the public profile page

CREATE POLICY "Anyone can view active instructors of driving schools" 
ON public.driving_school_instructors 
FOR SELECT 
USING (status = 'active');