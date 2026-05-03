
-- Restrict public SELECT exposure on sensitive tables to authenticated users.

-- user_roles: only authenticated users can see roles, and only their own (admins see all)
DROP POLICY IF EXISTS "Roles viewable by everyone" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- profiles: restrict to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- incidents: restrict to authenticated users
DROP POLICY IF EXISTS "Incidents are viewable by everyone" ON public.incidents;
CREATE POLICY "Authenticated users can view incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (true);

-- incident_status_history: restrict to authenticated users
DROP POLICY IF EXISTS "Status history viewable by everyone" ON public.incident_status_history;
CREATE POLICY "Authenticated users can view status history"
  ON public.incident_status_history FOR SELECT
  TO authenticated
  USING (true);

-- resolution_feedback: restrict to authenticated users
DROP POLICY IF EXISTS "Resolution feedback viewable by everyone" ON public.resolution_feedback;
CREATE POLICY "Authenticated users can view resolution feedback"
  ON public.resolution_feedback FOR SELECT
  TO authenticated
  USING (true);

-- verifications: restrict to authenticated users
DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON public.verifications;
CREATE POLICY "Authenticated users can view verifications"
  ON public.verifications FOR SELECT
  TO authenticated
  USING (true);

-- Realtime channel authorization: ensure users can only subscribe to their own
-- notification topics. Realtime channel topics are governed by RLS on
-- realtime.messages.
DROP POLICY IF EXISTS "Users subscribe to own notification channel" ON realtime.messages;
CREATE POLICY "Users subscribe to own notification channel"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() = 'notif-' || auth.uid()::text)
    OR (realtime.topic() NOT LIKE 'notif-%')
  );
