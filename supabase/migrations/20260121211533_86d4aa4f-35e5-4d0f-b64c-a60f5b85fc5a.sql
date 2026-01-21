-- Add media_type column to instructor_videos to support images
-- Values: 'video' or 'image'
ALTER TABLE public.instructor_videos
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'video';

-- Update existing records based on file extension or video_type
UPDATE public.instructor_videos
SET media_type = 'video';

-- Update the storage bucket to also accept image formats
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'instructor-videos';