-- Create storage bucket for reward photos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'reward-photos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'reward-photos',
      'reward-photos',
      true,
      10485760, -- 10MB
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
END $$;

-- RLS policies for reward photos
DO $$
BEGIN
  CREATE POLICY "Users can upload reward photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reward-photos');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can view reward photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reward-photos');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can delete reward photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reward-photos');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

