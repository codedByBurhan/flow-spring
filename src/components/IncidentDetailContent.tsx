import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileEdit, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/incidents";
import { QualityChips } from "@/components/QualityChips";
import { VerifyButton } from "@/components/VerifyButton";
import { StatusStepper } from "@/components/StatusStepper";
import { EscalationBanner, EscalationPill } from "@/components/EscalationPill";
import { ResolutionCard } from "@/components/ResolutionCard";
import { UpdateStatusSheet } from "@/components/UpdateStatusSheet";
import { useIncidentHistory } from "@/hooks/useIncidentHistory";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import type { Incident } from "@/types";

interface IncidentDetailContentProps {
  incident: Incident;
  reporterName?: string | null;
  distanceLabel?: string | null;
  organisation?: string | null;
}

export function IncidentDetailContent({
  incident,
  reporterName,
  distanceLabel,
  organisation,
}: IncidentDetailContentProps) {
  const { user } = useAuth();
  const { canUpdateStatus } = useUserRoles();
  const { history } = useIncidentHistory(incident.id);
  const [updateOpen, setUpdateOpen] = useState(false);

  const showUpdateButton = !!user && canUpdateStatus;

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <StatusStepper currentStatus={incident.status} history={history ?? []} />

      {/* Escalation banner */}
      <EscalationBanner createdAt={incident.created_at} status={incident.status} />

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          style={{
            backgroundColor: SEVERITY_COLORS[incident.severity] || "#888",
            color: incident.severity === "Low" ? "#333" : "#fff",
          }}
          className="text-[10px] uppercase tracking-wide"
        >
          {incident.severity}
        </Badge>
        <Badge
          variant="outline"
          style={{
            borderColor: STATUS_COLORS[incident.status] || "#888",
            color: STATUS_COLORS[incident.status] || "#888",
          }}
          className="text-[10px] uppercase tracking-wide bg-transparent"
        >
          {incident.status}
        </Badge>
        <EscalationPill createdAt={incident.created_at} status={incident.status} />
      </div>

      <QualityChips values={incident.quality_parameters} />

      {incident.photo_url && (
        <img
          src={incident.photo_url}
          alt="Incident"
          className="w-full rounded-lg max-h-64 object-cover"
        />
      )}

      <p className="text-sm text-foreground whitespace-pre-wrap">{incident.description}</p>

      <div className="text-xs text-muted-foreground space-y-1">
        {distanceLabel && <div>📍 {distanceLabel}</div>}
        <div>📍 {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</div>
        <div>
          🕒 {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
        </div>
        {reporterName && <div>👤 {reporterName}</div>}
      </div>

      <a
        href={`https://www.openstreetmap.org/?mlat=${incident.latitude}&mlon=${incident.longitude}#map=17/${incident.latitude}/${incident.longitude}`}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Navigation className="h-3.5 w-3.5" /> Open location in Maps
      </a>

      {/* Resolution card when resolved */}
      {incident.status === "Resolved" && (
        <ResolutionCard incident={incident} history={history} />
      )}

      {/* Verify button (community confirms early-stage incidents) */}
      {incident.status !== "Resolved" && <VerifyButton incident={incident} />}

      {/* Field agent / NGO controls */}
      {showUpdateButton && (
        <Button
          type="button"
          onClick={() => setUpdateOpen(true)}
          variant="outline"
          className="w-full h-12 gap-2 border-2"
          style={{ borderColor: "#2E7D32", color: "#2E7D32" }}
        >
          <FileEdit className="h-4 w-4" />
          Update status
        </Button>
      )}

      {showUpdateButton && (
        <UpdateStatusSheet
          incident={incident}
          open={updateOpen}
          onOpenChange={setUpdateOpen}
          defaultOrganisation={organisation}
        />
      )}
    </div>
  );
}
