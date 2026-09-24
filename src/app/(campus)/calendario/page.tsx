import type { Metadata } from "next";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendario" };

const KIND = {
  LIVE_CLASS: { label: "Clase en vivo", variant: "blue" },
  DEADLINE: { label: "Fecha de entrega", variant: "accent" },
  SERVICE: { label: "Culto", variant: "gold" },
  OTHER: { label: "Evento", variant: "muted" },
} as const;

export default async function CalendarPage() {
  const user = await requireUser();
  const events = await db.event.findMany({
    where: {
      startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      OR: [{ courseId: null }, { course: { enrollments: { some: { userId: user.id } } } }],
    },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: { course: { select: { title: true } } },
  });

  const monthFmt = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });
  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const key = monthFmt.format(e.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Calendario" description="Clases en vivo, fechas de entrega y actividades del Seminario." />
      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No hay eventos próximos" description="Cuando tus docentes programen clases o entregas aparecerán aquí." />
      ) : (
        <div className="space-y-10">
          {Array.from(groups.entries()).map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-4 font-serif text-2xl capitalize text-tas-navy">{month}</h2>
              <ul className="divide-y rounded-xl border bg-card">
                {list.map((e) => {
                  const k = KIND[e.kind];
                  const isLink = e.location?.startsWith("http");
                  return (
                    <li key={e.id} className="flex gap-5 p-5">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2 leading-none">
                        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-tas-crimson">
                          {new Intl.DateTimeFormat("es", { weekday: "short" }).format(e.startsAt)}
                        </span>
                        <span className="mt-1 font-serif text-2xl text-tas-navy">{e.startsAt.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={k.variant}>{k.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(e.startsAt)}
                            {e.endsAt && ` – ${formatTime(e.endsAt)}`}
                          </span>
                        </div>
                        <p className="mt-1.5 font-semibold">{e.title}</p>
                        {e.course && <p className="text-xs text-muted-foreground">{e.course.title}</p>}
                        {e.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.description}</p>}
                        {e.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs">
                            {isLink ? <Video className="size-3.5 text-tas-blue" /> : <MapPin className="size-3.5 text-muted-foreground" />}
                            {isLink ? (
                              <a href={e.location} target="_blank" rel="noreferrer" className="font-semibold text-tas-blue hover:underline">Unirse a la sesión</a>
                            ) : (
                              e.location
                            )}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
