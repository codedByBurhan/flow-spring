import { TrendingUp, Clock } from "lucide-react";
import { daysSince } from "@/lib/incidents";

interface EscalationPillProps {
  createdAt: string;
  status: string;
  className?: string;
}

export function getEscalationLevel(createdAt: string, status: string) {
  if (status !== "Submitted" && status !== "Under Review") return null;
  const d = daysSince(createdAt);
  if (d >= 7) return { level: "escalated" as const, days: d };
  if (d >= 3) return { level: "pending" as const, days: d };
  return null;
}

export function EscalationPill({ createdAt, status, className }: EscalationPillProps) {
  const esc = getEscalationLevel(createdAt, status);
  if (!esc) return null;

  if (esc.level === "escalated") {
    return (
      <span
        className={
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold " +
          (className ?? "")
        }
        style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
      >
        <TrendingUp className="h-3 w-3" />
        Escalated
      </span>
    );
  }
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium " +
        (className ?? "")
      }
      style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
    >
      <Clock className="h-3 w-3" />
      {esc.days} days pending
    </span>
  );
}

export function EscalationBanner({ createdAt, status }: { createdAt: string; status: string }) {
  const esc = getEscalationLevel(createdAt, status);
  if (!esc || esc.level !== "escalated") return null;
  return (
    <div
      className="flex items-start gap-2 rounded-lg p-3 text-xs font-medium"
      style={{ backgroundColor: "#FEE2E2", color: "#7F1D1D" }}
      role="alert"
    >
      <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
      <span>
        This report has been pending for {esc.days} days and has been flagged to higher
        authorities.
      </span>
    </div>
  );
}
