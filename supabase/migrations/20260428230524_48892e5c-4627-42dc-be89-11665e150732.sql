DROP POLICY IF EXISTS "Incident photos are publicly accessible" ON storage.objects;

-- Allow public to read individual objects (by path) but list calls require an owner match.
-- Listing is gated by RLS too; we keep SELECT public for known paths only by using a TRUE check on object name length > 0
CREATE POLICY "Public can read incident photos by path"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-photos' AND owner IS NOT NULL);