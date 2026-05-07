import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FlowSpringLogo } from "@/components/FlowSpringLogo";
import { MapPreview } from "@/components/MapPreview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useIncidentsRealtime } from "@/hooks/useIncidentsRealtime";
import { haversineDistance } from "@/lib/haversine";
import type { Incident } from "@/types";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/incidents";
import { EmptyState as SharedEmptyState } from "@/components/EmptyState";
import { QualityChips } from "@/components/QualityChips";
import { IncidentDetailContent } from "@/components/IncidentDetailContent";
import { EscalationPill } from "@/components/EscalationPill";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home — FlowSpring" }] }),
  component: HomePage,
});

function HomePage() {
  const geo = useGeolocation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Incident | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const { incidents } = useIncidentsRealtime();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();
  const [reporterName, setReporterName] = useState<string | null>(null);
  const [organisation, setOrganisation] = useState<string | null>(null);

  // Mark all read when bell opens
  useEffect(() => {
    if (notifOpen && unreadCount > 0) void markAllRead();
  }, [notifOpen, unreadCount, markAllRead]);

  // Load current user's organisation (for the Update Status default)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("organisation")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setOrganisation((data?.organisation as string | null) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load reporter name when an incident is selected
  useEffect(() => {
    if (!selected) {
      setReporterName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", selected.user_id)
        .maybeSingle();
      if (!cancelled) setReporterName(data?.display_name?.trim() || "Anonymous");
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Keep the open detail in sync with realtime updates (verify_count, status)
  useEffect(() => {
    if (!selected || !incidents) return;
    const fresh = incidents.find((i) => i.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [incidents, selected]);

  const sortedNearby = useMemo(() => {
    if (!incidents) return null;
    if (geo.latitude == null || geo.longitude == null) {
      return incidents.slice(0, 5).map((i) => ({ inc: i, km: null as number | null }));
    }
    return incidents
      .map((i) => ({
        inc: i,
        km: haversineDistance(
          { latitude: geo.latitude!, longitude: geo.longitude! },
          { latitude: i.latitude, longitude: i.longitude },
        ),
      }))
      .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
      .slice(0, 5);
  }, [incidents, geo.latitude, geo.longitude]);

  const nearbyCount = useMemo(() => {
    if (!incidents || geo.latitude == null || geo.longitude == null) return incidents?.length ?? 0;
    return incidents.filter(
      (i) =>
        haversineDistance(
          { latitude: geo.latitude!, longitude: geo.longitude! },
          { latitude: i.latitude, longitude: i.longitude },
        ) <= 10,
    ).length;
  }, [incidents, geo.latitude, geo.longitude]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <FlowSpringLogo size={32} />
            <span className="font-bold text-primary text-lg">FlowSpring</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen(true)}
            className="relative h-11 w-11 grid place-items-center rounded-full hover:bg-accent"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadCount > 0 && (
              <span
                className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "#E53935" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* District safety score */}
        <SafetyScoreCard incidents={incidents} />

        {/* Map card */}
        <div
          className="relative rounded-2xl overflow-hidden bg-white fs-shadow-card"
          style={{ border: "1px solid #F3F4F6" }}
        >
          {incidents === null ? (
            <Skeleton className="w-full" style={{ height: 200 }} />
          ) : (
            <MapPreview
              userLat={geo.latitude}
              userLng={geo.longitude}
              incidents={incidents}
            />
          )}
          {incidents && (
            <div
              className="absolute top-2 right-2 rounded-full px-3 py-1 fs-shadow-card"
              style={{
                background: "#fff",
                color: "#2E7D32",
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {nearbyCount} incidents near you
            </div>
          )}
          {/* Bottom blend gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 40,
              background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))",
            }}
          />
        </div>

        {/* CTA */}
        <Link to="/report" className="block">
          <Button
            type="button"
            className="w-full h-14 text-base font-bold gap-2 fs-press fs-shadow-button"
            style={{ backgroundColor: "#2E7D32", color: "#fff", borderRadius: 12 }}
          >
            <Plus className="h-5 w-5" /> Report an Incident
          </Button>
        </Link>

        {/* Recent */}
        <section>
          <h2
            className="mb-3"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: "#6B7280",
            }}
          >
            Recent near you
          </h2>
          {sortedNearby === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedNearby.length === 0 ? (
            <SharedEmptyState
              icon="💧"
              title="No incidents nearby — that's a good sign!"
              description="When new reports are filed near you, they'll appear here."
            />
          ) : (
            <ul className="space-y-3">
              {sortedNearby.map(({ inc, km }) => (
                <li key={inc.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(inc)}
                    className="w-full text-left bg-white rounded-2xl p-4 min-h-[44px] fs-shadow-card fs-press relative overflow-hidden"
                    style={{ border: "1px solid #F3F4F6" }}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0"
                      style={{
                        width: 4,
                        backgroundColor: SEVERITY_COLORS[inc.severity] || "#888",
                        borderTopLeftRadius: 16,
                        borderBottomLeftRadius: 16,
                      }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {inc.incident_type}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          {km != null && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
                            </span>
                          )}
                          <span>·</span>
                          <span>
                            {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <SeverityBadge severity={inc.severity} />
                        <StatusBadge status={inc.status} />
                        <EscalationPill createdAt={inc.created_at} status={inc.status} />
                      </div>
                    </div>
                    {inc.quality_parameters && inc.quality_parameters.length > 0 && (
                      <QualityChips values={inc.quality_parameters} className="mt-2" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <IncidentDetail
        incident={selected}
        reporterName={reporterName}
        organisation={organisation}
        onClose={() => setSelected(null)}
      />

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle>Notifications</SheetTitle>
              {notifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <SheetDescription className="sr-only">
              Status updates and alerts on your reports
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
            {notifications.length === 0 ? (
              <SharedEmptyState
                icon="🔔"
                title="No notifications yet"
                description="You'll see status updates on your reports here."
              />
            ) : (
              notifications.map((n) => {
                const inc = incidents?.find((i) => i.id === n.incident_id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      void markRead(n.id);
                      if (inc) {
                        setSelected(inc);
                        setNotifOpen(false);
                      }
                    }}
                    className={
                      "w-full text-left border rounded-lg p-3 hover:bg-accent transition-colors flex gap-3 " +
                      (n.read ? "bg-card" : "bg-primary/5 border-primary/20")
                    }
                  >
                    <div className="text-xl shrink-0" aria-hidden>
                      {n.icon ?? "🔔"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{n.message}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    {!n.read && (
                      <span
                        className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                );
              })
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => void clearAll()}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-2"
              >
                Clear all
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] || "#888";
  return (
    <Badge
      style={{ backgroundColor: color, color: severity === "Low" ? "#333" : "#fff" }}
      className="text-[10px] uppercase tracking-wide"
    >
      {severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#888";
  return (
    <Badge
      variant="outline"
      style={{ borderColor: color, color }}
      className="text-[10px] uppercase tracking-wide bg-transparent"
    >
      {status}
    </Badge>
  );
}

function SafetyScoreCard({ incidents }: { incidents: Incident[] | null }) {
  if (incidents === null) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }
  // Score: 100 - weighted by recent (≤30d) unresolved counts.
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = incidents.filter((i) => new Date(i.created_at).getTime() >= cutoff);
  const unresolved = recent.filter((i) => i.status !== "Resolved");
  const weight = unresolved.reduce(
    (a, i) => a + (i.severity === "High" ? 6 : i.severity === "Medium" ? 3 : 1),
    0,
  );
  const score = Math.max(0, Math.min(100, 100 - weight * 4));
  const color = score >= 71 ? "#43A047" : score >= 41 ? "#FB8C00" : "#E53935";
  const label = score >= 71 ? "Good" : score >= 41 ? "Caution" : "Action needed";

  // SVG ring math
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;

  return (
    <div
      className="relative bg-white rounded-2xl p-4 fs-shadow-card flex items-center gap-4 overflow-hidden"
      style={{ border: "1px solid #F3F4F6" }}
      role="region"
      aria-label="District water safety score"
    >
      <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden>
        <circle cx={32} cy={32} r={r} stroke="#F3F4F6" strokeWidth={6} fill="none" />
        <circle
          cx={32}
          cy={32}
          r={r}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dasharray 600ms ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 16, fontWeight: 700, fill: "#111827" }}
        >
          {score}
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
          District Water Safety
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
          Based on {recent.length} report{recent.length === 1 ? "" : "s"} · last 30 days
        </div>
        <div
          className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          {label}
        </div>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{ height: 4, backgroundColor: color }}
      />
    </div>
  );
}

function IncidentDetail({
  incident,
  reporterName,
  organisation,
  onClose,
}: {
  incident: Incident | null;
  reporterName: string | null;
  organisation: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {incident && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {incident.incident_type}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Incident details, location, severity, status, and confirmation
              </DialogDescription>
            </DialogHeader>
            <IncidentDetailContent
              incident={incident}
              reporterName={reporterName}
              organisation={organisation}
              onDeleted={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}