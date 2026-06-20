
-- Replace the permissive owner UPDATE policy with one that blocks privileged column changes
DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;

CREATE POLICY "Users can update their own incidents (non-privileged fields)"
ON public.incidents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT status FROM public.incidents i WHERE i.id = incidents.id)
  AND verify_count = (SELECT verify_count FROM public.incidents i WHERE i.id = incidents.id)
  AND resolution_photo_url IS NOT DISTINCT FROM (SELECT resolution_photo_url FROM public.incidents i WHERE i.id = incidents.id)
);

-- Allow privileged roles (field_agent, ngo_partner, admin) to update status/workflow fields on any incident
CREATE POLICY "Privileged roles can update incident status"
ON public.incidents
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['field_agent','ngo_partner','admin']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['field_agent','ngo_partner','admin']::public.app_role[]));
