-- Create instructor_videos table for storing instructor video content
CREATE TABLE public.instructor_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.instructor_videos ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_instructor_videos_instructor_id ON public.instructor_videos(instructor_id);

-- Policy: Anyone can view public videos
CREATE POLICY "Anyone can view public instructor videos" 
ON public.instructor_videos 
FOR SELECT 
USING (is_public = true);

-- Policy: Instructors can view all their own videos (including private)
CREATE POLICY "Instructors can view their own videos" 
ON public.instructor_videos 
FOR SELECT 
USING (
  instructor_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Policy: Instructors can insert their own videos
CREATE POLICY "Instructors can insert their own videos" 
ON public.instructor_videos 
FOR INSERT 
WITH CHECK (
  instructor_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Policy: Instructors can update their own videos
CREATE POLICY "Instructors can update their own videos" 
ON public.instructor_videos 
FOR UPDATE 
USING (
  instructor_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Policy: Instructors can delete their own videos
CREATE POLICY "Instructors can delete their own videos" 
ON public.instructor_videos 
FOR DELETE 
USING (
  instructor_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructor_videos_updated_at
BEFORE UPDATE ON public.instructor_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for instructor videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('instructor-videos', 'instructor-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view public videos
CREATE POLICY "Anyone can view instructor videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-videos');

-- Storage policy: Instructors can upload their own videos
CREATE POLICY "Instructors can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'instructor-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Instructors can update their own videos
CREATE POLICY "Instructors can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'instructor-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Instructors can delete their own videos
CREATE POLICY "Instructors can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'instructor-videos' AND auth.uid()::text = (storage.foldername(name))[1]);