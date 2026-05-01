export interface Incident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: "Low" | "Medium" | "High" | string;
  description: string;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  status:
    | "Submitted"
    | "Under Review"
    | "Verified"
    | "Action in Progress"
    | "Resolved"
    | string;
  created_at: string;
  updated_at: string;
  quality_parameters?: string[] | null;
  verify_count?: number;
  resolution_photo_url?: string | null;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  organisation?: string | null;
  language?: string | null;
}

export type AppRole = "user" | "field_agent" | "ngo_partner" | "admin";
export type IncidentStage =
  | "Submitted"
  | "Under Review"
  | "Verified"
  | "Action in Progress"
  | "Resolved";

export const INCIDENT_STAGES: IncidentStage[] = [
  "Submitted",
  "Under Review",
  "Verified",
  "Action in Progress",
  "Resolved",
];

export interface IncidentStatusHistory {
  id: string;
  incident_id: string;
  status: string;
  changed_by: string | null;
  responsible_party: string | null;
  note: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  incident_id: string | null;
  type: string;
  message: string;
  icon: string | null;
  read: boolean;
  created_at: string;
}

export interface ResolutionFeedback {
  id: string;
  incident_id: string;
  user_id: string;
  confirmed: boolean;
  created_at: string;
}