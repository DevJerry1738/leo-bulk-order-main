-- Create receipts bucket if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'receipts') THEN
    CALL storage.create_bucket('receipts');
  END IF;
END$$;

-- Allow authenticated users to upload receipts
CREATE POLICY "authenticated_upload_receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
);

-- Allow authenticated users to view receipts
CREATE POLICY "authenticated_view_receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
);

-- Allow users to delete only their own receipts
CREATE POLICY "authenticated_delete_own_receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);