import { Check } from "lucide-react";
import { format } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { INCIDENT_STAGES, type IncidentStatusHistory } from "@/types";
import { STATUS_COLORS } from "@/lib/incidents";
import { cn } from "@/lib/utils";

interface StatusStepperProps {
  currentStatus: string;
  history?: IncidentStatusHistory[];
}

export function StatusStepper({ currentStatus, history = [] }: StatusStepperProps) {
  const currentIdx = INCIDENT_STAGES.indexOf(currentStatus as (typeof INCIDENT_STAGES)[number]);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;
  const reduce = useReducedMotion();

  // Build map: latest history entry per stage
  const historyByStage = new Map<string, IncidentStatusHistory>();
  for (const h of [...history].reverse()) {
    if (!historyByStage.has(h.status)) historyByStage.set(h.status, h);
  }

  return (
    <div
      className="overflow-x-auto -mx-4 px-4 pb-1"
      role="list"
      aria-label="Status pipeline"
    >
      <ol className="flex items-start gap-1 min-w-max">
        {INCIDENT_STAGES.map((stage, idx) => {
          const isCurrent = idx === safeIdx;
          const isPast = idx < safeIdx;
          const isFuture = idx > safeIdx;
          const color = STATUS_COLORS[stage] || "#9CA3AF";
          const h = historyByStage.get(stage);

          return (
            <li
              key={stage}
              role="listitem"
              className="flex items-start"
              style={{ minWidth: 80 }}
            >
              <div className="flex flex-col items-center" style={{ width: 80 }}>
                <motion.div
                  layout
                  initial={false}
                  animate={
                    reduce
                      ? undefined
                      : { scale: isCurrent ? 1.12 : 1 }
                  }
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={cn(
                    "h-9 w-9 rounded-full grid place-items-center text-xs font-bold border-2 shrink-0",
                  )}
                  style={{
                    backgroundColor: isFuture ? "transparent" : color,
                    borderColor: color,
                    color: isFuture ? color : "#fff",
                    ...(isCurrent ? { boxShadow: `0 0 0 4px ${color}33` } : {}),
                  }}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                </motion.div>
                <div
                  className={cn(
                    "mt-1.5 text-[10px] text-center leading-tight px-0.5",
                    isCurrent ? "font-bold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {stage}
                </div>
                {h && !isFuture && (
                  <div className="text-[9px] text-muted-foreground mt-1 text-center leading-tight">
                    {format(new Date(h.created_at), "MMM d")}
                    {h.responsible_party && (
                      <div className="truncate max-w-[76px]">{h.responsible_party}</div>
                    )}
                  </div>
                )}
              </div>
              {idx < INCIDENT_STAGES.length - 1 && (
                <div
                  className="h-0.5 flex-1 mt-[18px] mx-0.5 rounded-full"
                  style={{
                    backgroundColor: idx < safeIdx ? color : "#E5E7EB",
                    minWidth: 20,
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
