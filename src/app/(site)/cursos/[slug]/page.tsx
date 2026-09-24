import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Check,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Globe,
  Layers,
  Link2,
  PlayCircle,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCourseDetail, getResumeLessonId, LEVEL_LABEL } from "@/lib/queries/courses";
import { getCurrentUser, isStaff } from "@/lib/session";
import { formatDuration, formatTimestamp } from "@/lib/domain/format";
import { getEmbedUrl, parseVideoUrl } from "@/lib/domain/video";
import { formatDate, pluralize } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { Avatar, Badge } from "@/components/ui/primitives";
import { CourseCover } from "@/components/course/course-cover";
import { EnrollButton } from "@/components/course/enroll-button";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { Stars } from "@/components/course/stars";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await db.course.findUnique({ where: { slug: params.slug }, select: { title: true, subtitle: true } });
  return course ? { title: course.title, description: course.subtitle ?? undefined } : {};
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const [course, user] = await Promise.all([getCourseDetail(params.slug), getCurrentUser()]);
  if (!course) notFound();
  if (course.status !== "PUBLISHED" && !(user && isStaff(user.role))) notFound();

  let enrolled = false;
  let resumeLessonId: string | null = null;
  if (user) {
    const e = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
    enrolled = !!e;
    if (enrolled) resumeLessonId = await getResumeLessonId(course.id, user.id);
  }
  const trailer = course.trailerUrl ? parseVideoUrl(course.trailerUrl) : null;
  const videoCount = course.modules.flatMap((m) => m.lessons).filter((l) => l.type === "VIDEO").length;
  const assessments = course.modules.flatMap((m) => m.lessons).filter((l) => l.type === "QUIZ" || l.type === "ASSIGNMENT").length;

  const facts = [
    { icon: Layers, label: "Estructura", value: `${pluralize(course.modules.length, "módulo")} · ${pluralize(course.lessonCount, "lección", "lecciones")}` },
    course.durationSeconds > 0 || course.estimatedHours
      ? {
          icon: Clock,
          label: "Duración",
          value: course.durationSeconds > 0 ? `${formatDuration(course.durationSeconds)} de video` : `${course.estimatedHours} horas de estudio`,
        }
      : null,
    { icon: Globe, label: "Idioma", value: course.language },
    course.certificateEnabled ? { icon: Award, label: "Certificación", value: "Certificado de finalización" } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  return (
    <>
      {/* Encabezado */}
      <section className="border-b bg-tas-cream/60">
        <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/cursos" className="hover:text-foreground">Catálogo</Link>
              <span>/</span>
              <span className="truncate">{course.category?.name ?? "Curso"}</span>
            </nav>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {course.category && <Badge variant="accent">{course.category.name}</Badge>}
              <Badge variant="outline">{LEVEL_LABEL[course.level]}</Badge>
              {course.status !== "PUBLISHED" && <Badge variant="gold">Borrador — solo visible para el equipo</Badge>}
            </div>
            <h1 className="display text-4xl leading-[1.08] md:text-[3.25rem]">{course.title}</h1>
            {course.subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{course.subtitle}</p>}

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {course.instructors.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {course.instructors.map(({ instructor }) => (
                      <Avatar key={instructor.id} name={instructor.name} src={instructor.photoUrl} size={36} className="ring-2 ring-tas-cream" />
                    ))}
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold">{course.instructors.map((i) => i.instructor.name).join(", ")}</p>
                    {course.instructors[0].instructor.title && (
                      <p className="text-xs text-muted-foreground">{course.instructors[0].instructor.title}</p>
                    )}
                  </div>
                </div>
              )}
              {course.rating && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{course.rating.toFixed(1)}</span>
                  <Stars value={course.rating} />
                  <span className="text-muted-foreground">({pluralize(course._count.reviews, "reseña")})</span>
                </div>
              )}
              {course._count.enrollments > 0 && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-4" /> {pluralize(course._count.enrollments, "estudiante")}
                </span>
              )}
            </div>
          </div>

        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-14 lg:order-1">
          {course.learningOutcomes.length > 0 && (
            <section className="rounded-xl border bg-card p-7">
              <h2 className="display text-3xl">Lo que aprenderás</h2>
              <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
                {course.learningOutcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-sm leading-relaxed">
                    <Check className="mt-0.5 size-4 shrink-0 text-tas-crimson" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.description && (
            <section>
              <h2 className="display mb-5 text-3xl">Sobre este curso</h2>
              <Markdown>{course.description}</Markdown>
            </section>
          )}

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="display text-3xl">Temario</h2>
              <p className="text-sm text-muted-foreground">
                {pluralize(course.modules.length, "módulo")} · {pluralize(course.lessonCount, "lección", "lecciones")}
                {course.durationSeconds > 0 && ` · ${formatDuration(course.durationSeconds)}`}
              </p>
            </div>
            <div className="divide-y overflow-hidden rounded-xl border bg-card">
              {course.modules.map((m, i) => {
                const secs = m.lessons.reduce((a, l) => a + l.durationSeconds, 0);
                return (
                  <details key={m.id} className="group" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition hover:bg-secondary/50 [&::-webkit-details-marker]:hidden">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-sm text-tas-navy">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{m.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {pluralize(m.lessons.length, "lección", "lecciones")}
                          {secs > 0 && ` · ${formatDuration(secs)}`}
                        </span>
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
                    </summary>
                    <ul className="border-t bg-background/40 py-1">
                      {m.lessons.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 pl-[4.25rem] text-sm">
                          <LessonTypeIcon type={l.type} className="text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          {l.isFreePreview && <Badge variant="blue">Vista previa</Badge>}
                          {l.durationSeconds > 0 && (
                            <span className="tabular-nums text-xs text-muted-foreground">{formatTimestamp(l.durationSeconds)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </section>

          {course.instructors.length > 0 && (
            <section>
              <h2 className="display mb-5 text-3xl">{course.instructors.length > 1 ? "Docentes" : "Docente"}</h2>
              <div className="space-y-4">
                {course.instructors.map(({ instructor }) => (
                  <div key={instructor.id} className="flex gap-5 rounded-xl border bg-card p-6">
                    <Avatar name={instructor.name} src={instructor.photoUrl} size={64} />
                    <div className="min-w-0">
                      <p className="font-serif text-xl text-tas-navy">{instructor.name}</p>
                      {instructor.title && <p className="text-sm text-muted-foreground">{instructor.title}</p>}
                      {instructor.bio && <p className="mt-3 text-sm leading-relaxed">{instructor.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.resources.length > 0 && (
            <section>
              <h2 className="display mb-5 text-3xl">Material del curso</h2>
              <ul className="divide-y rounded-xl border bg-card">
                {course.resources.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                    {r.kind === "PDF" ? <FileText className="size-4 text-tas-crimson" /> : r.kind === "LINK" ? <Link2 className="size-4 text-tas-blue" /> : <Download className="size-4 text-muted-foreground" />}
                    <span className="flex-1">{r.title}</span>
                    {enrolled ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-tas-blue hover:underline">Abrir</a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Disponible al inscribirte</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="display mb-5 text-3xl">Reseñas</h2>
            {course.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Este curso aún no tiene reseñas. Los estudiantes inscritos pueden calificarlo desde el aula.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {course.reviews.map((r) => (
                  <figure key={r.id} className="rounded-xl border bg-card p-5">
                    <Stars value={r.rating} />
                    {r.comment && <blockquote className="mt-3 text-sm leading-relaxed">{r.comment}</blockquote>}
                    <figcaption className="mt-4 flex items-center gap-2.5 text-xs text-muted-foreground">
                      <Avatar name={r.user.name} src={r.user.avatarUrl} size={24} />
                      <span className="font-semibold text-foreground">{r.user.name}</span> · {formatDate(r.createdAt)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="order-first lg:order-2 lg:-mt-[19rem]">
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-xl border bg-card shadow-lift">
              {trailer ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={getEmbedUrl(trailer)}
                    title={`Presentación de ${course.title}`}
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <CourseCover title={course.title} src={course.coverImageUrl} category={course.category?.name} className="aspect-video" />
              )}
              <div className="p-6">
                <p className="font-serif text-3xl text-tas-navy">Gratuito</p>
                <p className="mt-1 text-xs text-muted-foreground">Para estudiantes del programa hispano del Seminario.</p>
                <EnrollButton
                  courseId={course.id}
                  slug={course.slug}
                  state={!user ? "anonymous" : enrolled ? "enrolled" : "available"}
                  resumeLessonId={resumeLessonId}
                  className="mt-5 w-full"
                />
                <ul className="mt-6 space-y-3 border-t pt-5 text-sm">
                  {facts.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="flex gap-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>
                        <span className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                        {value}
                      </span>
                    </li>
                  ))}
                  {videoCount > 0 && (
                    <li className="flex gap-3">
                      <PlayCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{pluralize(videoCount, "clase en video", "clases en video")}{assessments > 0 && ` y ${pluralize(assessments, "evaluación", "evaluaciones")}`}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}