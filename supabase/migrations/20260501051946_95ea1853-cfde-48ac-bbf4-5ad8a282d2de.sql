
-- Lock down SECURITY DEFINER helpers from public API
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_incident_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_resolution_feedback() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_incident_verify_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Tighten notifications insert policy: users can only create notifications addressed to themselves.
-- The trigger function runs as SECURITY DEFINER and bypasses RLS, so this does not break automation.
DROP POLICY IF EXISTS "System inserts allowed" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Seed both current users as admin (so you can demo the field-agent controls)
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('78f6d9a6-2175-4c0b-9c4b-4cd0a2ee6895', 'admin'),
  ('b7e00089-c1b3-4d5a-b798-eb712aa1cf38', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
