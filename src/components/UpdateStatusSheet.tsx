import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, X, FileEdit } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { INCIDENT_STAGES, type Incident, type IncidentStage } from "@/types";
import { STATUS_COLORS, STAGE_ICON } from "@/lib/incidents";
import { cn } from "@/lib/utils";

interface UpdateStatusSheetProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultOrganisation?: string | null;
  onUpdated?: (newStatus: IncidentStage) => void;
}

export function UpdateStatusSheet({
  incident,
  open,
  onOpenChange,
  defaultOrganisation,
  onUpdated,
}: UpdateStatusSheetProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<IncidentStage>(incident.status as IncidentStage);
  const [responsibleParty, setResponsibleParty] = useState(defaultOrganisation ?? "");
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStage(incident.status as IncidentStage);
      setResponsibleParty(defaultOrganisation ?? "");
      setNote("");
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incident.id]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let resolutionPhotoUrl: string | null = null;

      if (stage === "Resolved" && photoFile) {
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/resolution-${incident.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("incident-photos")
          .upload(path, photoFile, { contentType: photoFile.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("incident-photos").getPublicUrl(path);
        resolutionPhotoUrl = data.publicUrl;
      }

      // Insert history FIRST so the status-change trigger can read responsible_party
      const { error: histErr } = await supabase.from("incident_status_history").insert({
        incident_id: incident.id,
        status: stage,
        changed_by: user.id,
        responsible_party: responsibleParty.trim() || null,
        note: note.trim() || null,
      });
      if (histErr) throw histErr;

      const updates: { status: IncidentStage; resolution_photo_url?: string | null } = {
        status: stage,
      };
      if (stage === "Resolved" && resolutionPhotoUrl) {
        updates.resolution_photo_url = resolutionPhotoUrl;
      }
      const { error: updErr } = await supabase
        .from("incidents")
        .update(updates)
        .eq("id", incident.id);
      if (updErr) throw updErr;

      toast.success(`Status updated to ${stage}`);
      onUpdated?.(stage);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Update status
          </SheetTitle>
          <SheetDescription>
            Choose a new stage and provide context for the reporter.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4 pb-6">
          {/* Stage cards */}
          <div className="space-y-2">
            <Label>New stage</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INCIDENT_STAGES.map((s) => {
                const selected = stage === s;
                const color = STATUS_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    aria-pressed={selected}
                    className={cn(
                      "min-h-[64px] flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                      selected ? "shadow-md" : "bg-background hover:bg-accent",
                    )}
                    style={{
                      borderColor: color,
                      backgroundColor: selected ? color : undefined,
                      color: selected ? "#fff" : undefined,
                    }}
                  >
                    <span className="text-2xl">{STAGE_ICON[s]}</span>
                    <span className="font-semibold">{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsible party */}
          <div className="space-y-2">
            <Label htmlFor="responsible-party">Responsible party</Label>
            <Input
              id="responsible-party"
              value={responsibleParty}
              onChange={(e) => setResponsibleParty(e.target.value)}
              placeholder="e.g. District Water Board, WaterAid NGO"
              className="h-12"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="status-note">Notes (optional)</Label>
            <Textarea
              id="status-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="Add context for the reporter…"
              rows={3}
            />
          </div>

          {/* Resolution photo (only when Resolved) */}
          {stage === "Resolved" && (
            <div className="space-y-2">
              <Label>After-fix photo (optional)</Label>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Resolution"
                    className="w-full max-h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-background/90 border shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="resolution-photo"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent min-h-[100px]"
                >
                  <Camera className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to add after-fix photo</span>
                  <input
                    ref={fileInputRef}
                    id="resolution-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhoto}
                  />
                </label>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 text-base font-semibold"
            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <FileEdit className="h-5 w-5 mr-2" />
                Save status update
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
