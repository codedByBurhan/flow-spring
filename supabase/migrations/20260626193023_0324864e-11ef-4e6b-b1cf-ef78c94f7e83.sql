
-- 1. Restrict incident_status_history inserts to privileged roles only
DROP POLICY IF EXISTS "Authorised users can insert history" ON public.incident_status_history;
CREATE POLICY "Privileged users can insert history"
  ON public.incident_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND public.has_any_role(auth.uid(), ARRAY['field_agent'::app_role, 'ngo_partner'::app_role, 'admin'::app_role])
  );

-- 2. Remove client INSERT on notifications - only triggers/service_role create them
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;

-- 3. Restrict realtime.messages subscriptions to enumerated topic patterns
DROP POLICY IF EXISTS "Authenticated can subscribe to non-notification topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can subscribe to allowed channels" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to allowed channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'incidents-realtime'
    OR realtime.topic() LIKE 'history-%'
    OR realtime.topic() = 'notif-' || (auth.uid())::text
  );
