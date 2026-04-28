import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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
} from "@/components/ui/dialog";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Incident } from "@/types";
import { SEVERITY_COLORS, STATUS_COLORS, distanceKm } from "@/lib/incidents";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home — FlowSpring" }] }),
  component: HomePage,
});

function HomePage() {
  const geo = useGeolocation();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!cancelled) setIncidents(error ? [] : (data as Incident[]));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedNearby = useMemo(() => {
    if (!incidents) return null;
    if (geo.latitude == null || geo.longitude == null) {
      return incidents.slice(0, 5).map((i) => ({ inc: i, km: null as number | null }));
    }
    return incidents
      .map((i) => ({
        inc: i,
        km: distanceKm(geo.latitude!, geo.longitude!, i.latitude, i.longitude),
      }))
      .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
      .slice(0, 5);
  }, [incidents, geo.latitude, geo.longitude]);

  const nearbyCount = useMemo(() => {
    if (!incidents || geo.latitude == null || geo.longitude == null) return incidents?.length ?? 0;
    return incidents.filter(
      (i) => distanceKm(geo.latitude!, geo.longitude!, i.latitude, i.longitude) <= 10,
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
            className="h-11 w-11 grid place-items-center rounded-full hover:bg-accent"
          >
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Map card */}
        <div className="relative rounded-xl overflow-hidden border bg-card shadow-sm">
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
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full px-3 py-1 text-xs font-medium shadow border">
              {nearbyCount} incidents near you
            </div>
          )}
        </div>

        {/* CTA */}
        <Link to="/report" className="block">
          <Button
            type="button"
            className="w-full h-14 text-base font-semibold gap-2"
            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
          >
            <Plus className="h-5 w-5" /> Report an Incident
          </Button>
        </Link>

        {/* Recent */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Recent near you</h2>
          {sortedNearby === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedNearby.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {sortedNearby.map(({ inc, km }) => (
                <li key={inc.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(inc)}
                    className="w-full text-left bg-card border rounded-xl p-4 min-h-[44px] hover:shadow-md transition-shadow"
                  >
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
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <IncidentDetail incident={selected} onClose={() => setSelected(null)} />
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

function EmptyState() {
  return (
    <div className="bg-card border rounded-xl p-8 text-center">
      <div className="text-4xl mb-2">💧</div>
      <p className="font-medium text-foreground">No reports yet nearby</p>
      <p className="text-sm text-muted-foreground mt-1">
        Be the first to report a water issue in your area.
      </p>
    </div>
  );
}

function IncidentDetail({
  incident,
  onClose,
}: {
  incident: Incident | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!incident} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {incident && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {incident.incident_type}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              {incident.photo_url && (
                <img
                  src={incident.photo_url}
                  alt="Incident"
                  className="w-full rounded-lg max-h-64 object-cover"
                />
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {incident.description}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  📍 {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                </div>
                <div>
                  🕒 {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}