-- Ensure the receipts private storage bucket exists (idempotent).
-- This bucket stores tenant payment receipts and maintenance photos.
-- It is PRIVATE — all access is controlled via signed URLs generated server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,  -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policy: tenants can upload only into their own folder (user_id/ prefix).
CREATE POLICY "Tenants can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: users can read only their own receipts.
-- Owners get access through service-role signed URLs generated server-side.
CREATE POLICY "Users can read their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
