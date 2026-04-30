export interface Incident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: "Low" | "Medium" | "High" | string;
  description: string;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  status: "Pending" | "Verified" | "Resolved" | string;
  created_at: string;
  updated_at: string;
  quality_parameters?: string[] | null;
  verify_count?: number;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}