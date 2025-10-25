-- Create storage bucket for chore photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chore-photos',
  'chore-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policy for chore photos
CREATE POLICY "Users can upload chore photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chore-photos');

CREATE POLICY "Users can view chore photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'chore-photos');

CREATE POLICY "Users can delete chore photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chore-photos');
