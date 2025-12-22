-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Create policy for instructors to upload vehicle photos
CREATE POLICY "Instructors can upload vehicle photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-photos' 
  AND auth.uid() IN (
    SELECT ip.user_id 
    FROM instructor_profiles ip
    WHERE ip.id::text = (storage.foldername(name))[1]
  )
);

-- Create policy for instructors to update their vehicle photos
CREATE POLICY "Instructors can update vehicle photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid() IN (
    SELECT ip.user_id 
    FROM instructor_profiles ip
    WHERE ip.id::text = (storage.foldername(name))[1]
  )
);

-- Create policy for instructors to delete their vehicle photos
CREATE POLICY "Instructors can delete vehicle photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid() IN (
    SELECT ip.user_id 
    FROM instructor_profiles ip
    WHERE ip.id::text = (storage.foldername(name))[1]
  )
);

-- Create policy for public read access to vehicle photos
CREATE POLICY "Vehicle photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-photos');