-- ============================================================
-- Migration 013: Add avatars storage and app_users photo
-- ============================================================

-- 1. Add photo_url to app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Create avatars bucket (make sure storage schema is used)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for storage.objects
-- Allow public read access to the avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files to the avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update files in the avatars bucket
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete files in the avatars bucket
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
