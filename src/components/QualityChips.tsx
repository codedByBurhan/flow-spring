interface QualityChipsProps {
  values?: string[] | null;
  className?: string;
}

export function QualityChips({ values, className }: QualityChipsProps) {
  if (!values || values.length === 0) return null;
  return (
    <div className={"flex flex-wrap gap-1.5 " + (className ?? "")}>
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-transparent"
          style={{ borderColor: "#0D9488", color: "#0D9488" }}
        >
          {v}
        </span>
      ))}
    </div>
  );
}