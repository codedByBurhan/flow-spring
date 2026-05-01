
-- =========================================================
-- 1. ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('user', 'field_agent', 'ngo_partner', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles)) $$;

CREATE POLICY "Roles viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2. PROFILES additions
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organisation text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en-IN';

-- =========================================================
-- 3. INCIDENTS schema migration (drop old constraint FIRST)
-- =========================================================
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_status_check;

UPDATE public.incidents SET status = 'Submitted' WHERE status = 'Pending';

ALTER TABLE public.incidents
  ALTER COLUMN status SET DEFAULT 'Submitted',
  ADD COLUMN IF NOT EXISTS resolution_photo_url text;

ALTER TABLE public.incidents
  ADD CONSTRAINT incidents_status_check
  CHECK (status IN ('Submitted','Under Review','Verified','Action in Progress','Resolved'));

CREATE OR REPLACE FUNCTION public.sync_incident_verify_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target_id uuid; new_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN target_id := NEW.incident_id; ELSE target_id := OLD.incident_id; END IF;
  SELECT COUNT(*) INTO new_count FROM public.verifications WHERE incident_id = target_id;
  UPDATE public.incidents
  SET verify_count = new_count,
      status = CASE WHEN new_count >= 3 AND status IN ('Submitted','Under Review') THEN 'Verified' ELSE status END,
      updated_at = now()
  WHERE id = target_id;
  RETURN NULL;
END;
$$;

-- =========================================================
-- 4. STATUS HISTORY
-- =========================================================
CREATE TABLE public.incident_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  responsible_party text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_history_incident ON public.incident_status_history(incident_id, created_at);
ALTER TABLE public.incident_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status history viewable by everyone" ON public.incident_status_history
FOR SELECT USING (true);

CREATE POLICY "Authorised users can insert history" ON public.incident_status_history
FOR INSERT TO authenticated
WITH CHECK (
  changed_by = auth.uid() AND (
    public.has_any_role(auth.uid(), ARRAY['field_agent','ngo_partner','admin']::public.app_role[])
    OR EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND i.user_id = auth.uid())
  )
);

-- =========================================================
-- 5. NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  icon text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts allowed" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_status_history;

-- =========================================================
-- 6. RESOLUTION FEEDBACK
-- =========================================================
CREATE TABLE public.resolution_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confirmed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, user_id)
);
CREATE INDEX idx_resolution_feedback_incident ON public.resolution_feedback(incident_id);
ALTER TABLE public.resolution_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resolution feedback viewable by everyone" ON public.resolution_feedback
FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert resolution feedback" ON public.resolution_feedback
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resolution feedback" ON public.resolution_feedback
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- 7. STATUS CHANGE TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_incident_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE msg text; ico text; ntype text; rp text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT responsible_party INTO rp
    FROM public.incident_status_history
    WHERE incident_id = NEW.id AND status = NEW.status
    ORDER BY created_at DESC LIMIT 1;

    CASE NEW.status
      WHEN 'Under Review' THEN
        msg := 'Your report is being reviewed by ' || COALESCE(rp, 'the response team');
        ico := '🔵'; ntype := 'under_review';
      WHEN 'Verified' THEN
        msg := 'Your report has been verified ✓ — action will be taken soon';
        ico := '✅'; ntype := 'verified';
      WHEN 'Action in Progress' THEN
        msg := 'Work has started on your reported issue';
        ico := '🔨'; ntype := 'in_progress';
      WHEN 'Resolved' THEN
        msg := 'Your issue has been marked resolved — please confirm if it''s fixed';
        ico := '✅'; ntype := 'resolved';
      ELSE
        IF OLD.status = 'Resolved' AND NEW.status = 'Under Review' THEN
          msg := 'Your resolved report has been reopened based on community feedback';
          ico := '🔄'; ntype := 'reopened';
        ELSE
          msg := NULL;
        END IF;
    END CASE;

    IF msg IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, incident_id, type, message, icon)
      VALUES (NEW.user_id, NEW.id, ntype, msg, ico);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_incident_status_change
AFTER UPDATE OF status ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.handle_incident_status_change();

-- =========================================================
-- 8. RESOLUTION FEEDBACK -> AUTO-REOPEN
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_resolution_feedback()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_confirmed int; v_still int; v_status text;
BEGIN
  SELECT status INTO v_status FROM public.incidents WHERE id = NEW.incident_id;
  SELECT
    COUNT(*) FILTER (WHERE confirmed = true),
    COUNT(*) FILTER (WHERE confirmed = false)
  INTO v_confirmed, v_still
  FROM public.resolution_feedback WHERE incident_id = NEW.incident_id;

  IF v_status = 'Resolved' AND v_still >= 2 AND v_still > v_confirmed THEN
    INSERT INTO public.incident_status_history (incident_id, status, changed_by, responsible_party, note)
    VALUES (NEW.incident_id, 'Under Review', NULL, 'Community', 'Reopened by community feedback');
    UPDATE public.incidents SET status = 'Under Review', updated_at = now()
    WHERE id = NEW.incident_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resolution_feedback
AFTER INSERT OR UPDATE ON public.resolution_feedback
FOR EACH ROW EXECUTE FUNCTION public.handle_resolution_feedback();

-- =========================================================
-- 9. SEED Submitted history for existing incidents
-- =========================================================
INSERT INTO public.incident_status_history (incident_id, status, changed_by, created_at)
SELECT id, 'Submitted', user_id, created_at FROM public.incidents
WHERE NOT EXISTS (SELECT 1 FROM public.incident_status_history h WHERE h.incident_id = incidents.id);
