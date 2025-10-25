-- Update storage bucket for chore photos (handles existing bucket)
-- First, let's check if the bucket exists and update it if needed

-- Check if bucket exists
DO $$
BEGIN
    -- If bucket doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chore-photos') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'chore-photos',
            'chore-photos',
            true,
            10485760, -- 10MB limit
            ARRAY['image/jpeg', 'image/png', 'image/webp']
        );
        RAISE NOTICE 'Created chore-photos bucket';
    ELSE
        RAISE NOTICE 'chore-photos bucket already exists';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload chore photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chore photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete chore photos" ON storage.objects;

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

-- Verify the setup
SELECT 'Storage bucket and policies created successfully' as status;
