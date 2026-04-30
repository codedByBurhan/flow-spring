-- Add new columns to incidents
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS quality_parameters text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verify_count integer NOT NULL DEFAULT 0;

-- Verifications table
CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_verifications_incident ON public.verifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user ON public.verifications(user_id);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications are viewable by everyone"
  ON public.verifications FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own verification (not own incident)"
  ON public.verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own verification"
  ON public.verifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger: keep verify_count in sync and auto-verify at 3
CREATE OR REPLACE FUNCTION public.sync_incident_verify_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  new_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_id := NEW.incident_id;
  ELSE
    target_id := OLD.incident_id;
  END IF;

  SELECT COUNT(*) INTO new_count
  FROM public.verifications
  WHERE incident_id = target_id;

  UPDATE public.incidents
  SET verify_count = new_count,
      status = CASE
        WHEN new_count >= 3 AND status = 'Pending' THEN 'Verified'
        ELSE status
      END,
      updated_at = now()
  WHERE id = target_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_verifications_sync ON public.verifications;
CREATE TRIGGER trg_verifications_sync
AFTER INSERT OR DELETE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.sync_incident_verify_count();