import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Camera, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  INCIDENT_TYPES,
  SEVERITY_COLORS,
  QUALITY_PARAMETERS,
  queueOfflineReport,
} from "@/lib/incidents";
import { cn } from "@/lib/utils";
import { VoiceInputButton } from "@/components/VoiceInputButton";

const TYPE_ICONS: Record<string, string> = {
  "Contaminated Water": "💧",
  "Broken Pipe": "🚰",
  "Dry Tap": "❌",
  "Sewage Overflow": "🚫",
  "Chemical Smell": "☣️",
  Other: "❓",
};

export const Route = createFileRoute("/_app/report")({
  head: () => ({
    meta: [
      { title: "Report a Water Incident — FlowSpring" },
      {
        name: "description",
        content:
          "Report a water safety issue — contaminated water, broken pipes, dry taps, sewage overflow — in 90 seconds with photo and GPS.",
      },
      { property: "og:title", content: "Report a Water Incident — FlowSpring" },
      {
        property: "og:description",
        content:
          "File a water safety report with photo, severity, and location — community-verified, NGO-routed.",
      },
      { property: "og:url", content: "https://flow-spring.lovable.app/report" },
    ],
    links: [{ rel: "canonical", href: "https://flow-spring.lovable.app/report" }],
  }),
  component: ReportPage,
});

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DESC = 500;

const reportSchema = z.object({
  incident_type: z.string().min(1, "Please choose an incident type"),
  severity: z.enum(["Low", "Medium", "High"], { message: "Severity is required" }),
  description: z
    .string()
    .trim()
    .min(1, "Please describe what you saw")
    .max(MAX_DESC, `Description must be under ${MAX_DESC} characters`),
});

type Severity = "Low" | "Medium" | "High";

function ReportPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const geo = useGeolocation();
  const [language, setLanguage] = useState<string>("en-IN");

  // Guests cannot submit reports — bounce to login with a friendly toast.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authLoading) return;
    if (!user) {
      toast.message("Sign in to report an incident", {
        description: "Reports help us track and resolve water issues — please log in or sign up.",
      });
      navigate({ to: "/login", search: { redirect: "/report" } as never });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data?.language) setLanguage(data.language);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [description, setDescription] = useState("");
  const [qualityParams, setQualityParams] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((p) => ({ ...p, photo: "Photo must be under 5MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, photo: "File must be an image" }));
      return;
    }
    setErrors((p) => ({ ...p, photo: "" }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleParam = (p: string) => {
    setQualityParams((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fieldErrors: Record<string, string> = {};

    const parsed = reportSchema.safeParse({
      incident_type: incidentType,
      severity,
      description,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
    }
    const haveGps = geo.latitude != null && geo.longitude != null;
    if (!haveGps && manualAddress.trim().length === 0) {
      fieldErrors.location = "Location or address is required";
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);

    // Offline → queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const photo_data_url = photoFile ? await fileToDataUrl(photoFile) : undefined;
      queueOfflineReport({
        incident_type: incidentType,
        severity: severity as Severity,
        description: description.trim(),
        latitude: geo.latitude,
        longitude: geo.longitude,
        manual_address: manualAddress.trim() || undefined,
        photo_data_url,
        created_at: new Date().toISOString(),
        quality_parameters: qualityParams,
      });
      toast.success("Saved offline — will sync when connected");
      setSubmitting(false);
      navigate({ to: "/home" });
      return;
    }

    try {
      let photo_url: string | null = null;
      if (photoFile && user) {
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("incident-photos")
          .upload(path, photoFile, { upsert: false, contentType: photoFile.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("incident-photos").getPublicUrl(path);
        photo_url = data.publicUrl;
      }

      const { error } = await supabase.from("incidents").insert({
        user_id: user!.id,
        incident_type: incidentType,
        severity: severity as string,
        description: description.trim(),
        photo_url,
        latitude: geo.latitude ?? 0,
        longitude: geo.longitude ?? 0,
        quality_parameters: qualityParams,
      });
      if (error) throw error;

      toast.success("Report submitted — thank you!");
      setIncidentType("");
      setSeverity("");
      setDescription("");
      setQualityParams([]);
      clearPhoto();
      setManualAddress("");
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const haveGps = geo.latitude != null && geo.longitude != null;

  // Form completion percentage for header progress bar
  const completion = useMemo(() => {
    let done = 0;
    const total = 4;
    if (incidentType) done++;
    if (severity) done++;
    if (description.trim().length > 0) done++;
    if (haveGps || manualAddress.trim().length > 0) done++;
    return Math.round((done / total) * 100);
  }, [incidentType, severity, description, manualAddress, haveGps]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-2 px-4 py-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            aria-label="Back"
            className="h-11 w-11 grid place-items-center rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold flex-1 text-center" style={{ color: "#111827" }}>
            Report Incident
          </h1>
          <div className="w-11" aria-hidden />
        </div>
        <div className="h-1 w-full bg-[#F3F4F6]">
          <div
            className="h-full"
            style={{
              width: `${completion}%`,
              backgroundColor: "#2E7D32",
              transition: "width 250ms ease",
            }}
            aria-hidden
          />
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-5"
        style={{
          paddingBottom:
            "calc(7rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Incident Type — large icon grid */}
        <div className="space-y-2">
          <Label
            className="block"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: "#6B7280",
            }}
          >
            What's the problem?
          </Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Incident type">
            {INCIDENT_TYPES.map((t) => {
              const selected = incidentType === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setIncidentType(t)}
                  className="rounded-2xl px-3 py-3 fs-press flex flex-col items-center justify-center gap-1 text-center min-h-[80px]"
                  style={{
                    backgroundColor: selected ? "#F1F8E9" : "#fff",
                    border: selected ? "2px solid #2E7D32" : "1px solid #F3F4F6",
                    boxShadow: selected ? "0 2px 8px rgba(46,125,50,0.15)" : "var(--fs-shadow-card)",
                  }}
                >
                  <span className="text-2xl" aria-hidden>{TYPE_ICONS[t] ?? "❓"}</span>
                  <span
                    className="text-[12px] font-semibold leading-tight"
                    style={{ color: selected ? "#2E7D32" : "#374151" }}
                  >
                    {t}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.incident_type && (
            <p className="text-sm" style={{ color: "#E53935" }}>{errors.incident_type}</p>
          )}
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label>Severity *</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["Low", "Medium", "High"] as Severity[]).map((s) => {
              const selected = severity === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "h-12 rounded-lg border-2 font-medium transition-all min-h-[44px]",
                    selected ? "text-white shadow-md" : "bg-background text-foreground",
                  )}
                  style={
                    selected
                      ? { backgroundColor: SEVERITY_COLORS[s], borderColor: SEVERITY_COLORS[s], color: s === "Low" ? "#333" : "#fff" }
                      : { borderColor: SEVERITY_COLORS[s] }
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
          {errors.severity && (
            <p className="text-sm text-destructive">{errors.severity}</p>
          )}
        </div>

        {/* Observable indicators */}
        <div className="space-y-2">
          <Label>Observable indicators</Label>
          <p className="text-xs text-muted-foreground">
            Select all that apply (optional, helps verify water quality).
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_PARAMETERS.map((p) => {
              const selected = qualityParams.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleParam(p)}
                  aria-pressed={selected}
                  className={cn(
                    "min-h-[44px] px-3 py-2 rounded-full text-xs font-medium border-2 transition-colors text-left",
                    selected
                      ? "text-white"
                      : "bg-background text-foreground hover:bg-accent",
                  )}
                  style={
                    selected
                      ? { backgroundColor: "#0D9488", borderColor: "#0D9488" }
                      : { borderColor: "#0D9488", color: "#0D9488" }
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo upload */}
        <div className="space-y-2">
          <Label>Photo (optional)</Label>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Incident photo preview"
                className="w-full max-h-64 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Remove photo"
                className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-background/90 border shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="photo"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-accent transition-colors min-h-[120px]"
            >
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to add a photo (max 5MB)</span>
              <input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          )}
          {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description *</Label>
            <VoiceInputButton
              language={language}
              onTranscript={(t) =>
                setDescription((prev) =>
                  (prev ? prev + " " : "") + t
                )
              }
            />
          </div>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
            placeholder="What did you observe? (or tap the mic to speak)"
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-between text-xs">
            <span className="text-destructive">{errors.description ?? ""}</span>
            <span className="text-muted-foreground">
              {description.length}/{MAX_DESC}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          {geo.loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Detecting location…
            </div>
          ) : haveGps ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
            >
              <MapPin className="h-4 w-4" />
              GPS location detected ✓
              <span className="text-xs font-normal opacity-80">
                {geo.latitude!.toFixed(4)}, {geo.longitude!.toFixed(4)}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <Input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter address or area"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                We couldn't detect your location. Please enter it manually.
              </p>
            </div>
          )}
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location}</p>
          )}
        </div>
      </form>

      {/* Pinned submit — above mobile bottom nav, flush to bottom on tablet/desktop */}
      <div className="fs-pinned-submit fixed inset-x-0 md:left-64 lg:left-64 bg-background border-t p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            type="button"
            onClick={handleSubmit as unknown as (e: React.MouseEvent) => void}
            disabled={submitting}
            className="w-full h-14 text-base font-semibold"
            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}