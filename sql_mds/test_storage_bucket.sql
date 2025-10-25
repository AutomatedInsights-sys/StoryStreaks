-- Test script to verify storage bucket configuration
-- Run this in your Supabase SQL editor to check bucket status

-- Check if the bucket exists and is public
SELECT 
    id, 
    name, 
    public, 
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'chore-photos';

-- Check if there are any objects in the bucket
SELECT 
    id,
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'chore-photos'
ORDER BY created_at DESC
LIMIT 10;

-- Check RLS policies on storage.objects
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
AND policyname LIKE '%chore%';

-- Test if we can access the bucket (this should return true if bucket is accessible)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chore-photos' AND public = true) 
        THEN 'Bucket is public and accessible'
        ELSE 'Bucket is private or does not exist'
    END as bucket_status;
