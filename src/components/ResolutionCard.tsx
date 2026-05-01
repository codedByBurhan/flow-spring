import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Incident, IncidentStatusHistory } from "@/types";

interface ResolutionCardProps {
  incident: Incident;
  history: IncidentStatusHistory[] | null;
}

export function ResolutionCard({ incident, history }: ResolutionCardProps) {
  const { user } = useAuth();
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [stillCount, setStillCount] = useState(0);
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"confirm" | "still" | null>(null);

  const resolvedHistory = history?.slice().reverse().find((h) => h.status === "Resolved") ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: feedback }, mineRes] = await Promise.all([
        supabase
          .from("resolution_feedback")
          .select("confirmed, user_id")
          .eq("incident_id", incident.id),
        user
          ? supabase
              .from("resolution_feedback")
              .select("confirmed")
              .eq("incident_id", incident.id)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      const rows = (feedback as { confirmed: boolean }[] | null) ?? [];
      setConfirmedCount(rows.filter((r) => r.confirmed).length);
      setStillCount(rows.filter((r) => !r.confirmed).length);
      setMyVote((mineRes.data as { confirmed: boolean } | null)?.confirmed ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [incident.id, user]);

  const submitVote = async (confirmed: boolean) => {
    if (!user) {
      toast.error("Sign in to confirm");
      return;
    }
    if (myVote !== null) return;
    setSubmitting(confirmed ? "confirm" : "still");
    const { error } = await supabase
      .from("resolution_feedback")
      .insert({ incident_id: incident.id, user_id: user.id, confirmed });
    if (error) {
      toast.error(error.message);
      setSubmitting(null);
      return;
    }
    if (confirmed) setConfirmedCount((c) => c + 1);
    else setStillCount((c) => c + 1);
    setMyVote(confirmed);
    toast.success(confirmed ? "Marked as fixed — thank you!" : "Reported as still broken");
    setSubmitting(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: "#81C784", backgroundColor: "#F0FDF4" }}
    >
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5" style={{ color: "#16A34A" }} />
        <h3 className="font-semibold" style={{ color: "#14532D" }}>
          Resolution details
        </h3>
      </div>

      {resolvedHistory?.responsible_party && (
        <div className="text-sm">
          <span className="text-muted-foreground">Resolved by:</span>{" "}
          <span className="font-medium">{resolvedHistory.responsible_party}</span>
        </div>
      )}
      {resolvedHistory?.note && (
        <div className="text-sm">
          <span className="text-muted-foreground">Note:</span>{" "}
          <span>{resolvedHistory.note}</span>
        </div>
      )}

      {incident.resolution_photo_url && (
        <img
          src={incident.resolution_photo_url}
          alt="After-fix photo"
          className="w-full rounded-lg max-h-56 object-cover border"
        />
      )}

      <div className="pt-2 space-y-2">
        <div className="text-xs font-medium text-foreground">Is this fixed?</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={myVote !== null || submitting !== null || !user}
            onClick={() => submitVote(true)}
            className="h-12 gap-2"
            style={{
              backgroundColor: myVote === true ? "#16A34A" : "#22C55E",
              color: "#fff",
              opacity: myVote === false ? 0.4 : 1,
            }}
          >
            {submitting === "confirm" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            Confirmed fixed ({confirmedCount})
          </Button>
          <Button
            type="button"
            disabled={myVote !== null || submitting !== null || !user}
            onClick={() => submitVote(false)}
            className="h-12 gap-2"
            style={{
              backgroundColor: myVote === false ? "#B91C1C" : "#EF4444",
              color: "#fff",
              opacity: myVote === true ? 0.4 : 1,
            }}
          >
            {submitting === "still" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsDown className="h-4 w-4" />
            )}
            Issue still exists ({stillCount})
          </Button>
        </div>
        {myVote !== null && (
          <p className="text-xs text-muted-foreground text-center">
            You voted: {myVote ? "Confirmed fixed" : "Issue still exists"}
          </p>
        )}
        {!user && (
          <p className="text-xs text-muted-foreground text-center">Sign in to vote</p>
        )}
      </div>
    </div>
  );
}
