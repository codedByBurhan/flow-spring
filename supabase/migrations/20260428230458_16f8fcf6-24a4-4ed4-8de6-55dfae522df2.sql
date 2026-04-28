-- Storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Incident photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own incident photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'incident-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own incident photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own incident photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'incident-photos' AND auth.uid()::text = (storage.foldername(name))[1]);