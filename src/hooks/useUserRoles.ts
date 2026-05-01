import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/types";

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState<boolean>(!!user);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasRole = (r: AppRole) => roles.includes(r);
  const hasAnyRole = (rs: AppRole[]) => rs.some((r) => roles.includes(r));
  const canUpdateStatus = hasAnyRole(["field_agent", "ngo_partner", "admin"]);

  return { roles, loading, hasRole, hasAnyRole, canUpdateStatus };
}
