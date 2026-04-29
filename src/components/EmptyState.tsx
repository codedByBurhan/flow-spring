import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="bg-card border rounded-xl p-8 text-center flex flex-col items-center gap-2">
      <div className="text-5xl mb-1" aria-hidden>
        {icon ?? "💧"}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
