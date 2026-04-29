ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER TABLE public.incidents REPLICA IDENTITY FULL;