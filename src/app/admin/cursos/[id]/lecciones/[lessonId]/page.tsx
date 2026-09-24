import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { LessonEditor } from "@/components/admin/lesson-editor";
import { QuizBuilder } from "@/components/admin/quiz-builder";
import { ResourcesEditor } from "@/components/admin/resources-editor";
import { LESSON_TYPES, LessonTypeIcon } from "@/components/admin/labels";
import { getLessonForEditor, requireCourseAccess } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Editar lección" };

export default async function LessonEditorPage({ params }: { params: { id: string; lessonId: string } }) {
  await requireCourseAccess(params.id);
  const data = await getLessonForEditor(params.id, params.lessonId);
  if (!data) notFound();
  const { lesson, prev, next, position } = data;
  const course = lesson.module.course;
  const base = `/admin/cursos/${course.id}`;
  const isAssessment = lesson.type === "QUIZ" || lesson.type === "ASSIGNMENT";

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: "Cursos", href: "/admin/cursos" },
          { label: course.title, href: `${base}/contenido` },
          { label: lesson.title },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`${base}/contenido`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al currículo
        </Link>
        <nav aria-label="Navegación entre lecciones" className="flex items-center gap-1">
          <span className="mr-2 text-xs tabular-nums text-muted-foreground">
            Lección {position.index} de {position.total}
          </span>
          {prev ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/lecciones/${prev.id}`} title={prev.title}>
                <ChevronLeft /> <span className="hidden sm:inline">Anterior</span>
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="No hay lección anterior">
              <ChevronLeft /> <span className="hidden sm:inline">Anterior</span>
            </Button>
          )}
          {next ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/lecciones/${next.id}`} title={next.title}>
                <span className="hidden sm:inline">Siguiente</span> <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="No hay lección siguiente">
              <span className="hidden sm:inline">Siguiente</span> <ChevronRight />
            </Button>
          )}
        </nav>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <LessonTypeIcon type={lesson.type} className="mt-1 size-10 [&_svg]:size-5" />
        <div className="min-w-0">
          <p className="eyebrow mb-1">
            {lesson.module.title} · {LESSON_TYPES[lesson.type].label}
          </p>
          <h1 className="display text-2xl leading-tight md:text-[2rem]">{lesson.title}</h1>
        </div>
      </div>

      <LessonEditor
        key={lesson.updatedAt.toISOString()}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary ?? "",
          type: lesson.type,
          isPublished: lesson.isPublished,
          isFreePreview: lesson.isFreePreview,
          videoUrl: lesson.videoUrl ?? "",
          durationSeconds: lesson.durationSeconds,
          content: lesson.content ?? "",
          transcript: lesson.transcript ?? "",
        }}
        previewHref={`/aprender/${course.slug}/${lesson.id}`}
      />

      {isAssessment && (
        <section className="mt-10 border-t pt-10" aria-labelledby="quiz-heading">
          <QuizBuilder
            lessonId={lesson.id}
            lessonType={lesson.type as "QUIZ" | "ASSIGNMENT"}
            quiz={{
              instructions: lesson.quiz?.instructions ?? "",
              passingScore: lesson.quiz?.passingScore ?? 70,
              maxAttempts: lesson.quiz?.maxAttempts ?? null,
              timeLimitMinutes: lesson.quiz?.timeLimitMinutes ?? null,
              shuffleQuestions: lesson.quiz?.shuffleQuestions ?? false,
              showAnswers: lesson.quiz?.showAnswers ?? true,
              attemptCount: lesson.quiz?._count.attempts ?? 0,
            }}
            questions={(lesson.quiz?.questions ?? []).map((q) => ({
              id: q.id,
              type: q.type,
              prompt: q.prompt,
              explanation: q.explanation ?? "",
              points: q.points,
              acceptedAnswers: q.acceptedAnswers,
              options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
            }))}
          />
        </section>
      )}

      <section className="mt-10 border-t pt-10" aria-labelledby="resources-heading">
        <div className="mb-5 max-w-3xl">
          <h2 id="resources-heading" className="font-serif text-2xl text-tas-navy">
            Recursos de la lección
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lecturas, diapositivas o audios que acompañan esta clase. Arrastra para ordenarlos.
          </p>
        </div>
        <div className="max-w-3xl">
          <ResourcesEditor scope={{ lessonId: lesson.id }} initial={lesson.resources} />
        </div>
      </section>
    </div>
  );
}
