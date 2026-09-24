export default function CampusLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Cargando">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-tas-stone/70" />
        <div className="h-10 w-80 max-w-full rounded bg-tas-stone/70" />
      </div>
      <div className="h-40 rounded-2xl bg-tas-stone/50" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-tas-stone/40" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-tas-stone/40" />
        ))}
      </div>
    </div>
  );
}
