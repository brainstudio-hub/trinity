export default function ClassroomLoading() {
  return (
    <div className="flex h-screen flex-col" aria-busy="true" aria-label="Cargando lección">
      <div className="h-14 border-b bg-surface" />
      <div className="flex min-h-0 flex-1">
        <div className="flex-1">
          <div className="aspect-video max-h-[70vh] w-full animate-pulse bg-tas-navy-deep" />
          <div className="mx-auto max-w-[1100px] space-y-3 px-8 py-8">
            <div className="h-3 w-48 animate-pulse rounded bg-tas-stone/70" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-tas-stone/70" />
          </div>
        </div>
        <div className="hidden w-[380px] border-l bg-surface lg:block">
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-tas-stone/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
