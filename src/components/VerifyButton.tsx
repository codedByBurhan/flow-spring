import { useEffect, useState } from "react";
import { ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Incident } from "@/types";

interface VerifyButtonProps {
  incident: Incident;
  onVerified?: (newCount: number, autoVerified: boolean) => void;
}

export function VerifyButton({ incident, onVerified }: VerifyButtonProps) {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(incident.verify_count ?? 0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const isOwner = !!user && user.id === incident.user_id;

  useEffect(() => {
    setCount(incident.verify_count ?? 0);
  }, [incident.verify_count, incident.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          setHasVoted(false);
          setChecking(false);
        }
        return;
      }
      setChecking(true);
      const { data } = await supabase
        .from("verifications")
        .select("id")
        .eq("incident_id", incident.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setHasVoted(!!data);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, incident.id]);

  const handleVerify = async () => {
    if (!user || hasVoted || isOwner || loading) return;
    setLoading(true);
    const { error } = await supabase
      .from("verifications")
      .insert({ incident_id: incident.id, user_id: user.id });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const newCount = count + 1;
    setCount(newCount);
    setHasVoted(true);
    setLoading(false);
    if (newCount >= 3) {
      toast.success("Thanks for confirming — this report is now verified.");
    } else {
      toast.success("Thanks for confirming this incident.");
    }
    onVerified?.(newCount, newCount >= 3);
  };

  if (!user) {
    return (
      <Button type="button" disabled variant="outline" className="w-full h-12 gap-2">
        <ThumbsUp className="h-4 w-4" />
        Sign in to confirm ({count})
      </Button>
    );
  }

  if (isOwner) {
    return (
      <Button type="button" disabled variant="outline" className="w-full h-12 gap-2">
        <ThumbsUp className="h-4 w-4" />
        {count} confirmation{count === 1 ? "" : "s"}
      </Button>
    );
  }

  const disabled = hasVoted || loading || checking;
  return (
    <Button
      type="button"
      onClick={handleVerify}
      disabled={disabled}
      className="w-full h-12 gap-2"
      style={
        hasVoted
          ? { backgroundColor: "#81C784", color: "#fff" }
          : { backgroundColor: "#2E7D32", color: "#fff" }
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp className="h-4 w-4" />
      )}
      {hasVoted ? `You confirmed this (${count})` : `Confirm this incident (${count})`}
    </Button>
  );
}