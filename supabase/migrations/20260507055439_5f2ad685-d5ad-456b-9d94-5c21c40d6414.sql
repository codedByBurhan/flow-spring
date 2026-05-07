CREATE POLICY "Admins can delete incidents"
ON public.incidents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));