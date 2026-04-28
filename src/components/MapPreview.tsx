import { useEffect, useRef } from "react";
import type { Incident } from "@/types";
import { SEVERITY_COLORS } from "@/lib/incidents";

interface Props {
  userLat: number | null;
  userLng: number | null;
  incidents: Incident[];
  height?: number;
}

export function MapPreview({ userLat, userLng, incidents, height = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let mapInstance: import("leaflet").Map | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const center: [number, number] = userLat != null && userLng != null
        ? [userLat, userLng]
        : [20, 0];

      mapInstance = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView(center, userLat != null ? 13 : 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapInstance);

      if (userLat != null && userLng != null) {
        const pulseIcon = L.divIcon({
          className: "",
          html: `<div class="user-pulse"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker([userLat, userLng], { icon: pulseIcon }).addTo(mapInstance);
      }

      incidents.forEach((inc) => {
        L.circleMarker([inc.latitude, inc.longitude], {
          radius: 8,
          color: SEVERITY_COLORS[inc.severity] || "#888",
          fillColor: SEVERITY_COLORS[inc.severity] || "#888",
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(mapInstance!);
      });

      mapRef.current = mapInstance;
    })();

    return () => {
      cancelled = true;
      if (mapInstance) mapInstance.remove();
      mapRef.current = null;
    };
  }, [userLat, userLng, incidents]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden bg-muted"
      aria-label="Map preview"
    />
  );
}