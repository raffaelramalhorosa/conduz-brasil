-- Add cover_photo_url field to instructor_profiles
ALTER TABLE public.instructor_profiles 
ADD COLUMN IF NOT EXISTS cover_photo_url text;

-- Create storage bucket for instructor banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-banners', 'instructor-banners', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for instructor banners bucket
CREATE POLICY "Anyone can view instructor banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-banners');

CREATE POLICY "Instructors can upload their own banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update their own banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete their own banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instructor-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);