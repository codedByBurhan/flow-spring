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
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Update user marker + recenter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (cancelled || !map) return;
      if (userLat == null || userLng == null) return;
      const pulseIcon = L.divIcon({
        className: "",
        html: `<div class="user-pulse"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      } else {
        userMarkerRef.current = L.marker([userLat, userLng], { icon: pulseIcon }).addTo(map);
      }
      map.setView([userLat, userLng], 13, { animate: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [userLat, userLng]);

  // Update incident markers without rebuilding map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = markersLayerRef.current;
      if (cancelled || !layer) return;
      layer.clearLayers();
      incidents.forEach((inc) => {
        L.circleMarker([inc.latitude, inc.longitude], {
          radius: 8,
          color: SEVERITY_COLORS[inc.severity] || "#888",
          fillColor: SEVERITY_COLORS[inc.severity] || "#888",
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(layer);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [incidents]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden bg-muted"
      aria-label="Map preview"
    />
  );
}