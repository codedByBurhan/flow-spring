import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IncidentDetailContent } from "@/components/IncidentDetailContent";
import { EscalationPill } from "@/components/EscalationPill";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/incidents";
import type { Incident, Profile } from "@/types";
import { EmptyState } from "@/components/EmptyState";
import { useUserRoles } from "@/hooks/useUserRoles";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — FlowSpring" }] }),
  component: ProfilePage,
});

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

const SETTINGS_KEY = "flowspring_settings";

interface SettingsState {
  pushNotifications: boolean;
  offlineMode: boolean;
  language: "en" | "hi" | "te";
}

const DEFAULT_SETTINGS: SettingsState = {
  pushNotifications: true,
  offlineMode: false,
  language: "en",
};

function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { roles } = useUserRoles();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Incident[] | null>(null);
  const [stats, setStats] = useState({ submitted: 0, verified: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const updateSettings = (next: Partial<SettingsState>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
    // Persist language to profile for voice input
    if (next.language && user) {
      const langMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        te: "te-IN",
      };
      void supabase
        .from("profiles")
        .update({ language: langMap[next.language] ?? "en-IN" })
        .eq("id", user.id);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const [{ data: prof }, { data: incs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("incidents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setProfile((prof as Profile) ?? null);
      const list = (incs as Incident[]) ?? [];
      setReports(list);
      setStats({
        submitted: list.length,
        verified: list.filter((i) => i.status === "Verified").length,
        resolved: list.filter((i) => i.status === "Resolved").length,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  // Guest view (no user)
  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-6 bg-card text-center space-y-3">
          <h2 className="text-xl font-semibold text-primary">Create an account to track your reports</h2>
          <p className="text-sm text-muted-foreground">
            Sign up to submit reports, see your impact, and get nearby alerts.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(profile?.display_name ?? null, user?.email ?? null);
  const roleLabel =
    roles.includes("admin")
      ? "Admin"
      : roles.includes("ngo_partner")
        ? "NGO Partner"
        : roles.includes("field_agent")
          ? "Field Agent"
          : null;

  return (
    <div className="max-w-2xl mx-auto pb-6">
      {/* Gradient banner */}
      <div className="relative">
        <div
          style={{
            height: 120,
            background: "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)",
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
          aria-hidden
        />
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -28 }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              width={56}
              height={56}
              className="rounded-full object-cover"
              style={{ border: "3px solid #fff", boxShadow: "var(--fs-shadow-card)" }}
            />
          ) : (
            <div
              className="grid place-items-center font-bold text-white"
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: "#2E7D32",
                border: "3px solid #fff",
                fontSize: 18,
                boxShadow: "var(--fs-shadow-card)",
              }}
              aria-label={`Avatar for ${displayName}`}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      <div className="text-center pt-10 px-4">
        <h1 className="text-base font-bold" style={{ color: "#111827" }}>
          {displayName}
        </h1>
        <p className="text-xs" style={{ color: "#6B7280" }}>{user?.email}</p>
        {roleLabel && (
          <span
            className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: "#F1F8E9", color: "#2E7D32" }}
          >
            {roleLabel}
          </span>
        )}
      </div>

      <div className="px-4 pt-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Submitted", value: stats.submitted },
          { label: "Verified", value: stats.verified },
          { label: "Resolved", value: stats.resolved },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center bg-card">
            {loading ? (
              <Skeleton className="h-7 w-10 mx-auto mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary">{s.value}</div>
            )}
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* My Reports */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My Reports</h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className="w-full text-left fs-press"
                >
                  <Card className="p-3 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.incident_type}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(r.created_at), "MMM d, yyyy · h:mm a")}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          style={{
                            backgroundColor: SEVERITY_COLORS[r.severity] ?? "#999",
                            color: r.severity === "Low" ? "#212121" : "#fff",
                          }}
                        >
                          {r.severity}
                        </Badge>
                        <Badge
                          style={{
                            backgroundColor: STATUS_COLORS[r.status] ?? "#999",
                            color: "#fff",
                          }}
                        >
                          {r.status}
                        </Badge>
                        <EscalationPill createdAt={r.created_at} status={r.status} />
                      </div>
                    </div>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="📝"
            title="You haven't submitted any reports yet."
            description="Help your community by reporting your first water safety incident."
            action={
              <Button asChild className="mt-2 bg-primary text-primary-foreground">
                <Link to="/report">Submit a report</Link>
              </Button>
            }
          />
        )}
      </section>

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Settings</h2>
        <Card className="p-4 bg-card divide-y">
          <div className="flex items-center justify-between py-2 min-h-[44px]">
            <Label htmlFor="push-notif" className="font-normal">
              Push Notifications
            </Label>
            <Switch
              id="push-notif"
              checked={settings.pushNotifications}
              onCheckedChange={(v) => updateSettings({ pushNotifications: v })}
            />
          </div>
          <div className="flex items-center justify-between py-2 min-h-[44px]">
            <Label htmlFor="offline-mode" className="font-normal">
              Offline Mode
            </Label>
            <Switch
              id="offline-mode"
              checked={settings.offlineMode}
              onCheckedChange={(v) => updateSettings({ offlineMode: v })}
            />
          </div>
          <div className="flex items-center justify-between py-2 min-h-[44px] gap-3">
            <Label htmlFor="lang" className="font-normal">
              Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSettings({ language: v as SettingsState["language"] })}
            >
              <SelectTrigger id="lang" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </section>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={() => setConfirmLogout(true)}
        className="w-full min-h-[44px] border-2"
        style={{ borderColor: "#E53935", color: "#E53935" }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.incident_type}</DialogTitle>
                <DialogDescription className="sr-only">
                  Incident details and status
                </DialogDescription>
              </DialogHeader>
              <IncidentDetailContent
                incident={selected}
                onDeleted={() => setSelected(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of FlowSpring?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to submit reports or see your impact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              style={{ backgroundColor: "#E53935", color: "#fff" }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}