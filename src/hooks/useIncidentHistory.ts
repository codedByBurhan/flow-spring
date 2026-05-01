import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IncidentStatusHistory } from "@/types";

export function useIncidentHistory(incidentId: string | null | undefined) {
  const [history, setHistory] = useState<IncidentStatusHistory[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("incident_status_history")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setHistory((data as IncidentStatusHistory[]) ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`history-${incidentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incident_status_history",
          filter: `incident_id=eq.${incidentId}`,
        },
        (payload) => {
          const row = payload.new as IncidentStatusHistory;
          setHistory((prev) => (prev ? [...prev, row] : [row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [incidentId]);

  return { history, loading };
}
