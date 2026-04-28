export function StubScreen({ title }: { title: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <h1 className="text-3xl font-bold text-primary">{title}</h1>
    </div>
  );
}