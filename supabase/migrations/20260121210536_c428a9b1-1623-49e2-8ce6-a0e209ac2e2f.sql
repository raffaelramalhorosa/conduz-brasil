-- Add video_type column to distinguish between external URLs and uploaded files
ALTER TABLE public.instructor_videos 
ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'url' CHECK (video_type IN ('url', 'upload'));

-- Update bucket configuration
UPDATE storage.buckets 
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
WHERE id = 'instructor-videos';