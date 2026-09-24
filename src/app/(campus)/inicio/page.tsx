import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, Clock, Megaphone, MessageSquareText, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMyCourses } from "@/lib/queries/courses";
import { formatDuration } from "@/lib/domain/format";
import { formatRelative, formatShortDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Progress, Stat } from "@/components/ui/primitives";
import { CourseProgressRow } from "@/components/campus/course-progress-card";

export const metadata: Metadata = { title: "Inicio" };

const EVENT_LABEL = { LIVE_CLASS: "Clase en vivo", DEADLINE: "Entrega", SERVICE: "Culto", OTHER: "Evento" } as const;
const EVENT_BADGE = { LIVE_CLASS: "blue", DEADLINE: "accent", SERVICE: "gold", OTHER: "muted" } as const;

function greeting() {
  const h = Number(new Intl.DateTimeFormat("es", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date()));
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage({ searchParams }: { searchParams: { bienvenida?: string } }) {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  const [courses, stats, certificates, events, announcements, feedback] = await Promise.all([
    getMyCourses(user.id),
    db.lessonProgress.aggregate({
      where: { userId: user.id },
      _sum: { watchedSeconds: true },
    }),
    db.certificate.count({ where: { userId: user.id } }),
    db.event.findMany({
      where: {
        startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        OR: [{ courseId: null }, { course: { enrollments: { some: { userId: user.id } } } }],
      },
      orderBy: { startsAt: "asc" },
      take: 4,
      include: { course: { select: { title: true } } },
    }),
    db.announcement.findMany({
      where: {
        isPublished: true,
        OR: [{ courseId: null }, { course: { enrollments: { some: { userId: user.id } } } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.quizAttempt.findMany({
      where: { userId: user.id, status: "GRADED", gradedAt: { not: null }, quiz: { lesson: { type: "ASSIGNMENT" } } },
      orderBy: { gradedAt: "desc" },
      take: 3,
      include: { quiz: { select: { lesson: { select: { id: true, title: true, module: { select: { course: { select: { slug: true } } } } } } } } },
    }),
  ]);

  const completedLessons = await db.lessonProgress.count({ where: { userId: user.id, isCompleted: true } });
  const inProgress = courses.filter((c) => !c.summary.isComplete);
  const current = inProgress[0] ?? courses[0];

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-2">{new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
        <h1 className="display text-4xl md:text-5xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {searchParams.bienvenida
            ? "Tu cuenta está lista. Explora el catálogo e inscríbete en tu primer curso."
            : "Este es tu espacio de estudio. Retoma tus clases y revisa lo que viene."}
        </p>
      </div>

      {current && current.resume ? (
        <section className="relative overflow-hidden rounded-2xl bg-tas-navy p-7 text-tas-cream shadow-lift md:p-9">
          <div aria-hidden className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "radial-gradient(circle at 90% 0%, #F2AF00 0, transparent 40%)" }} />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-tas-gold">Continúa donde lo dejaste</p>
              <p className="mt-3 font-serif text-3xl leading-tight text-tas-cream md:text-4xl">{current.course.title}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-tas-cream/75">
                <PlayCircle className="size-4 shrink-0" />
                <span className="truncate">{current.resume.moduleTitle} · {current.resume.title}</span>
              </p>
              <div className="mt-6 flex max-w-md items-center gap-3">
                <Progress value={current.summary.percent} tone="light" className="bg-white/15" />
                <span className="shrink-0 text-sm font-semibold tabular-nums">{current.summary.percent}%</span>
              </div>
              <p className="mt-2 text-xs text-tas-cream/60">
                {current.summary.completed} de {current.summary.total} lecciones completadas
              </p>
            </div>
            <Button asChild size="lg" variant="inverse">
              <Link href={`/aprender/${current.course.slug}/${current.resume.id}`}>
                Continuar <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<BookOpen />}
          title="Aún no estás inscrito en ningún curso"
          description="Explora el catálogo del Seminario y comienza tu formación."
          action={
            <Button asChild>
              <Link href="/cursos">Explorar el catálogo</Link>
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Cursos activos" value={inProgress.length} icon={<BookOpen />} hint={`${courses.length} en total`} />
        <Stat label="Lecciones completadas" value={completedLessons} icon={<CheckCircle2 />} />
        <Stat label="Tiempo de estudio" value={formatDuration(stats._sum.watchedSeconds ?? 0)} icon={<Clock />} hint="En clases de video" />
        <Stat label="Certificados" value={certificates} icon={<Award />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-2xl text-tas-navy">Mis cursos</h2>
            <Link href="/mis-cursos" className="text-sm font-semibold text-tas-blue hover:underline">Ver todos</Link>
          </div>
          {courses.length ? (
            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => (
                <CourseProgressRow key={c.enrollment.id} item={c} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Cuando te inscribas en un curso aparecerá aquí.</p>
          )}

          {feedback.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 font-serif text-2xl text-tas-navy">Retroalimentación reciente</h2>
              <div className="space-y-3">
                {feedback.map((a) => (
                  <Link
                    key={a.id}
                    href={`/aprender/${a.quiz.lesson.module.course.slug}/${a.quiz.lesson.id}`}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4 text-sm transition hover:shadow-soft"
                  >
                    <MessageSquareText className="size-5 text-tas-blue" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{a.quiz.lesson.title}</span>
                      <span className="text-xs text-muted-foreground">Calificada {a.gradedAt && formatRelative(a.gradedAt)}</span>
                    </span>
                    <Badge variant={a.passed ? "success" : "accent"}>{a.score?.toFixed(0)} / 100</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-tas-navy">Próximos eventos</h2>
              <Link href="/calendario" className="text-muted-foreground hover:text-foreground" aria-label="Ver calendario">
                <CalendarDays className="size-4" />
              </Link>
            </div>
            {events.length ? (
              <ul className="space-y-4">
                {events.map((e) => (
                  <li key={e.id} className="flex gap-3.5">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-surface py-1.5 leading-none">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-tas-crimson">
                        {formatShortDate(e.startsAt).split(" ")[1]?.replace(".", "")}
                      </span>
                      <span className="mt-1 font-serif text-xl text-tas-navy">{new Date(e.startsAt).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(e.startsAt)}{e.course && ` · ${e.course.title}`}</p>
                      <Badge variant={EVENT_BADGE[e.kind]} className="mt-1.5">{EVENT_LABEL[e.kind]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay eventos programados.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl text-tas-navy">
              <Megaphone className="size-4 text-tas-crimson" /> Anuncios
            </h2>
            {announcements.length ? (
              <ul className="divide-y">
                {announcements.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{formatRelative(a.publishedAt)}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{a.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{a.body}</p>
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs font-semibold text-tas-blue hover:underline">
                        Más información
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin anuncios por ahora.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
