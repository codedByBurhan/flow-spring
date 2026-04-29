import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Incident } from "@/types";

export interface UseIncidentsRealtimeOptions {
  onInsert?: (incident: Incident) => void;
  onUpdate?: (incident: Incident) => void;
}

export function useIncidentsRealtime(opts: UseIncidentsRealtimeOptions = {}) {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) setError(error.message);
      setIncidents((data as Incident[] | null) ?? []);
    })();

    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        (payload) => {
          const inc = payload.new as Incident;
          setIncidents((prev) => (prev ? [inc, ...prev.filter((i) => i.id !== inc.id)] : [inc]));
          optsRef.current.onInsert?.(inc);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "incidents" },
        (payload) => {
          const inc = payload.new as Incident;
          setIncidents((prev) =>
            prev ? prev.map((i) => (i.id === inc.id ? inc : i)) : [inc],
          );
          optsRef.current.onUpdate?.(inc);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "incidents" },
        (payload) => {
          const old = payload.old as Partial<Incident>;
          setIncidents((prev) => (prev ? prev.filter((i) => i.id !== old.id) : prev));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { incidents, error };
}