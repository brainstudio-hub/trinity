import type { Metadata } from "next";
import Link from "next/link";
import { Clock, NotebookPen, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatTimestamp } from "@/lib/domain/format";
import { formatDate } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";

export const metadata: Metadata = { title: "Mis notas" };

export default async function NotesPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const q = searchParams.q?.trim();
  const notes = await db.note.findMany({
    where: { userId: user.id, ...(q ? { content: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: [{ updatedAt: "desc" }],
    take: 300,
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          position: true,
          module: { select: { position: true, course: { select: { id: true, slug: true, title: true } } } },
        },
      },
    },
  });

  // Agrupar por curso y lección
  const byCourse = new Map<string, { course: { slug: string; title: string }; lessons: Map<string, { title: string; id: string; notes: typeof notes }> }>();
  for (const n of notes) {
    const c = n.lesson.module.course;
    if (!byCourse.has(c.id)) byCourse.set(c.id, { course: c, lessons: new Map() });
    const group = byCourse.get(c.id)!;
    if (!group.lessons.has(n.lesson.id)) group.lessons.set(n.lesson.id, { id: n.lesson.id, title: n.lesson.title, notes: [] });
    group.lessons.get(n.lesson.id)!.notes.push(n);
  }

  return (
    <>
      <PageHeader
        eyebrow="Aprendizaje"
        title="Mis notas"
        description="Todos tus apuntes, organizados por curso y lección. Haz clic en el minuto para volver a ese momento de la clase."
      />
      <form className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Buscar en mis notas…" className="pl-9" />
      </form>

      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          title={q ? "Sin coincidencias" : "Aún no tienes notas"}
          description={q ? "Prueba con otra palabra." : "Mientras ves una clase, abre la pestaña «Notas» del aula para guardar tus apuntes con el minuto exacto."}
        />
      ) : (
        <div className="space-y-10">
          {Array.from(byCourse.values()).map(({ course, lessons }) => (
            <section key={course.slug}>
              <h2 className="mb-4 font-serif text-2xl text-tas-navy">{course.title}</h2>
              <div className="space-y-4">
                {Array.from(lessons.values()).map((l) => (
                  <div key={l.id} className="rounded-xl border bg-card">
                    <Link
                      href={`/aprender/${course.slug}/${l.id}`}
                      className="flex items-center justify-between gap-3 border-b px-5 py-3 text-sm font-semibold transition hover:bg-secondary/40"
                    >
                      {l.title}
                      <span className="text-xs font-normal text-muted-foreground">{l.notes.length} {l.notes.length === 1 ? "nota" : "notas"}</span>
                    </Link>
                    <ul className="divide-y">
                      {l.notes
                        .sort((a, b) => (a.timestampSeconds ?? -1) - (b.timestampSeconds ?? -1))
                        .map((n) => (
                          <li key={n.id} className="flex gap-4 px-5 py-3.5">
                            {n.timestampSeconds !== null ? (
                              <Link
                                href={`/aprender/${course.slug}/${l.id}?t=${n.timestampSeconds}`}
                                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-tas-navy px-2 text-2xs font-semibold tabular-nums text-tas-cream hover:bg-tas-blue"
                              >
                                <Clock className="size-3" />
                                {formatTimestamp(n.timestampSeconds)}
                              </Link>
                            ) : (
                              <span className="h-6 shrink-0 rounded-full bg-secondary px-2 text-2xs font-semibold leading-6 text-muted-foreground">General</span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.updatedAt)}</p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
