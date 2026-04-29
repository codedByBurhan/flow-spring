import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useIncidentsRealtime } from "@/hooks/useIncidentsRealtime";
import { haversineDistance } from "@/lib/haversine";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/incidents";
import type { Incident } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/map")({
  head: () => ({ meta: [{ title: "Map — FlowSpring" }] }),
  component: MapPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Contaminated Water", label: "Contaminated Water" },
  { id: "Broken Pipe", label: "Broken Pipe" },
  { id: "Dry Tap", label: "Dry Tap" },
  { id: "Sewage Overflow", label: "Sewage" },
  { id: "Other", label: "Other" },
  { id: "resolved", label: "Resolved" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function pinColor(inc: Incident): string {
  if (inc.status === "Resolved") return "#81C784";
  return SEVERITY_COLORS[inc.severity] || "#888";
}

function MapPage() {
  const geo = useGeolocation();
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [reporterName, setReporterName] = useState<string>("Anonymous");
  const seenIdsRef = useRef<Set<string>>(new Set());
  const geoRef = useRef(geo);
  geoRef.current = geo;

  const { incidents } = useIncidentsRealtime({
    onInsert: (inc) => {
      if (seenIdsRef.current.has(inc.id)) return;
      seenIdsRef.current.add(inc.id);
      const g = geoRef.current;
      if (g.latitude == null || g.longitude == null) return;
      if (inc.severity !== "High" && inc.severity !== "Medium") return;
      const d = haversineDistance(
        { latitude: g.latitude, longitude: g.longitude },
        { latitude: inc.latitude, longitude: inc.longitude },
      );
      if (d <= 10) toast("New incident reported nearby");
    },
  });

  const filtered = useMemo(() => {
    if (!incidents) return [];
    if (filter === "all") return incidents;
    if (filter === "resolved") return incidents.filter((i) => i.status === "Resolved");
    return incidents.filter((i) => i.incident_type === filter && i.status !== "Resolved");
  }, [incidents, filter]);

  // Load reporter name when an incident is selected
  useEffect(() => {
    if (!selected) return;
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

  const distanceLabel = useMemo(() => {
    if (!selected || geo.latitude == null || geo.longitude == null) return null;
    const km = haversineDistance(
      { latitude: geo.latitude, longitude: geo.longitude },
      { latitude: selected.latitude, longitude: selected.longitude },
    );
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
  }, [selected, geo.latitude, geo.longitude]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "calc(100dvh - 5rem)", minHeight: 480 }}
    >
      {incidents === null && (
        <Skeleton className="absolute inset-0 z-[10] rounded-none" />
      )}
      <LeafletMap
        userLat={geo.latitude}
        userLng={geo.longitude}
        incidents={filtered}
        onSelect={setSelected}
      />

      {incidents !== null && filtered.length === 0 && (
        <div className="absolute inset-x-0 bottom-24 z-[450] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-sm w-full">
            <EmptyState
              icon="🗺️"
              title="No incidents to show"
              description="Try a different filter or check back later."
            />
          </div>
        </div>
      )}

      {/* Filter chip row */}
      <div className="absolute top-0 inset-x-0 z-[400] pointer-events-none">
        <div className="pointer-events-auto bg-gradient-to-b from-background/95 to-background/0 pt-3 pb-6 px-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "shrink-0 min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors",
                    active
                      ? "border-transparent text-white"
                      : "bg-background border-border text-foreground hover:bg-accent",
                  )}
                  style={active ? { backgroundColor: "#2E7D32" } : undefined}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-background/85 backdrop-blur rounded-xl shadow-lg border p-3 text-xs space-y-1.5">
        <div className="font-semibold mb-1">Legend</div>
        <LegendRow color="#E53935" label="High" />
        <LegendRow color="#FB8C00" label="Medium" />
        <LegendRow color="#FDD835" label="Low" />
        <LegendRow color="#81C784" label="Resolved" />
      </div>

      {/* Bottom sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.incident_type}</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 mt-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    style={{
                      backgroundColor: SEVERITY_COLORS[selected.severity] || "#888",
                      color: selected.severity === "Low" ? "#333" : "#fff",
                    }}
                    className="text-[10px] uppercase tracking-wide"
                  >
                    {selected.severity}
                  </Badge>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: STATUS_COLORS[selected.status] || "#888",
                      color: STATUS_COLORS[selected.status] || "#888",
                    }}
                    className="text-[10px] uppercase tracking-wide bg-transparent"
                  >
                    {selected.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {distanceLabel && <div>📍 {distanceLabel}</div>}
                  <div>
                    🕒{" "}
                    {formatDistanceToNow(new Date(selected.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                  <div>👤 {reporterName}</div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                <Button
                  className="w-full h-12"
                  style={{ backgroundColor: "#2E7D32", color: "#fff" }}
                >
                  View Details
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-3 rounded-full border border-white shadow"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

interface LeafletMapProps {
  userLat: number | null;
  userLng: number | null;
  incidents: Incident[];
  onSelect: (inc: Incident) => void;
}

function LeafletMap({ userLat, userLng, incidents, onSelect }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const clusterRef = useRef<import("leaflet").LayerGroup | null>(null);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
      }).setView([userLat ?? 20, userLng ?? 0], userLat != null ? 13 : 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userLat == null || userLng == null) return;
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (cancelled || !map) return;
      const icon = L.divIcon({
        className: "",
        html: `<div class="user-pulse"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      } else {
        userMarkerRef.current = L.marker([userLat, userLng], { icon }).addTo(map);
        map.setView([userLat, userLng], 13);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userLat, userLng]);

  // Update incident markers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      const map = mapRef.current;
      if (cancelled || !map) return;

      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      const cluster = (
        L as unknown as { markerClusterGroup: (opts?: unknown) => import("leaflet").LayerGroup }
      ).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
      });

      incidents.forEach((inc) => {
        const color = pinColor(inc);
        const marker = L.circleMarker([inc.latitude, inc.longitude], {
          radius: 9,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        });
        marker.on("click", () => onSelectRef.current(inc));
        (cluster as unknown as { addLayer: (m: unknown) => void }).addLayer(marker);
      });

      map.addLayer(cluster);
      clusterRef.current = cluster;
    })();
    return () => {
      cancelled = true;
    };
  }, [incidents]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Incident map" />;
}