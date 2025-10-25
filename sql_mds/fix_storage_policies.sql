-- Fix storage policies for chore photos (bucket already exists)
-- This script only updates the RLS policies without creating the bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload chore photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chore photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete chore photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chore photos" ON storage.objects;

-- Create updated RLS policies for chore photos
CREATE POLICY "Users can upload chore photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chore-photos');

CREATE POLICY "Users can view chore photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'chore-photos');

CREATE POLICY "Users can delete chore photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chore-photos');

-- Verify the bucket exists
SELECT 
    id, 
    name, 
    public, 
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'chore-photos';

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%chore photos%';
