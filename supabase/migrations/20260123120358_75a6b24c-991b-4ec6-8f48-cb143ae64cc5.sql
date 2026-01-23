-- Drop policies that were partially created
DROP POLICY IF EXISTS "Documents: users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Documents: users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Documents: users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Documents: users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Documents: admins can view all" ON storage.objects;
DROP POLICY IF EXISTS "Documents: public read access" ON storage.objects;

-- Recreate documents bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own documents
CREATE POLICY "Docs bucket: users upload own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view their own documents
CREATE POLICY "Docs bucket: users view own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own documents
CREATE POLICY "Docs bucket: users update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own documents
CREATE POLICY "Docs bucket: users delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow admins to view all documents (for verification)
CREATE POLICY "Docs bucket: admins view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND is_admin()
);

-- Allow public read access for documents bucket (since it's public)
CREATE POLICY "Docs bucket: public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');