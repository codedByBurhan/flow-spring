import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getOfflineQueue,
  setOfflineQueue,
  type OfflineReport,
} from "@/lib/incidents";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export function useOfflineSync() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const syncing = useRef(false);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  useEffect(() => {
    if (!user || !online) return;
    if (syncing.current) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    syncing.current = true;
    let cancelled = false;
    (async () => {
      const remaining: OfflineReport[] = [];
      let synced = 0;

      for (const item of queue) {
        if (cancelled || !userIdRef.current) {
          remaining.push(item);
          continue;
        }
        try {
          let photo_url: string | null = null;
          if (item.photo_data_url) {
            const blob = await dataUrlToBlob(item.photo_data_url);
            const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
            const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("incident-photos")
              .upload(path, blob, { contentType: blob.type, upsert: false });
            if (!upErr) {
              photo_url = supabase.storage.from("incident-photos").getPublicUrl(path).data.publicUrl;
            }
          }

          const { error } = await supabase.from("incidents").insert({
            user_id: user.id,
            incident_type: item.incident_type,
            severity: item.severity,
            description: item.description,
            photo_url,
            latitude: item.latitude ?? 0,
            longitude: item.longitude ?? 0,
            quality_parameters: item.quality_parameters ?? [],
          });
          if (error) {
            remaining.push(item);
          } else {
            synced++;
          }
        } catch {
          remaining.push(item);
        }
      }

      setOfflineQueue(remaining);
      if (!cancelled && synced > 0) {
        toast.success(`Synced ${synced} offline report${synced === 1 ? "" : "s"}`);
      }
      syncing.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, online]);
}