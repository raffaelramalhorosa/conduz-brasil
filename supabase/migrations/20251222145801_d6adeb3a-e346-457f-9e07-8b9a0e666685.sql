-- Create instructor-documents bucket for storing instructor documents
INSERT INTO storage.buckets (id, name, public) VALUES ('instructor-documents', 'instructor-documents', true);

-- RLS policies for instructor-documents bucket
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'instructor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'instructor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'instructor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to documents (for admin review)
CREATE POLICY "Documents are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'instructor-documents');