export const SEVERITY_COLORS: Record<string, string> = {
  Low: "#FDD835",
  Medium: "#FB8C00",
  High: "#E53935",
};

export const STATUS_COLORS: Record<string, string> = {
  Pending: "#FB8C00",
  Verified: "#43A047",
  Resolved: "#81C784",
};

export const INCIDENT_TYPES = [
  "Contaminated Water",
  "Broken Pipe",
  "Dry Tap",
  "Sewage Overflow",
  "Chemical Smell",
  "Other",
] as const;

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface OfflineReport {
  incident_type: string;
  severity: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  manual_address?: string;
  photo_data_url?: string;
  created_at: string;
}

const QUEUE_KEY = "flowspring_offline_queue";

export function queueOfflineReport(report: OfflineReport) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  existing.push(report);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
}