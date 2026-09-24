import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { GradingForm } from "@/components/admin/grading-form";
import { LESSON_TYPES } from "@/components/admin/labels";
import { countUserAttempts, getAttemptForGrading, requireCourseAccess } from "@/lib/queries/admin";
import { buildGradingInput } from "@/lib/domain/grading";
import { gradeAttempt } from "@/lib/domain/quiz";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Calificar entrega" };

export default async function GradeAttemptPage({ params }: { params: { attemptId: string } }) {
  const attempt = await getAttemptForGrading(params.attemptId);
  if (!attempt) notFound();
  const course = attempt.quiz.lesson.module.course;
  await requireCourseAccess(course.id);
  if (attempt.status === "IN_PROGRESS") notFound();

  const attemptsByUser = await countUserAttempts(attempt.quizId, attempt.userId);
  const questions = attempt.quiz.questions;
  const input = buildGradingInput(questions, attempt.answers, {});
  const auto = gradeAttempt(input.questions, input.answers, attempt.quiz.passingScore);
  const answers = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const lesson = attempt.quiz.lesson;

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: "Calificaciones", href: "/admin/calificaciones" },
          { label: `${attempt.user.name} — ${lesson.title}` },
        ]}
      />
      <Link
        href="/admin/calificaciones"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a la cola
      </Link>

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-2">
            {course.title} · {lesson.module.title}
          </p>
          <h1 className="display text-2xl leading-tight md:text-[2.125rem]">{lesson.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="muted">{LESSON_TYPES[lesson.type].label}</Badge>
            <Badge variant={attempt.status === "GRADED" ? "success" : "gold"}>
              {attempt.status === "GRADED" ? "Calificada" : "Pendiente"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <Avatar name={attempt.user.name} src={attempt.user.avatarUrl} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{attempt.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{attempt.user.email}</p>
            <p className="text-2xs text-muted-foreground">
              {attempt.submittedAt ? `Entregada el ${formatDate(attempt.submittedAt)}, ${formatTime(attempt.submittedAt)}` : "Sin fecha de entrega"}
              {attemptsByUser > 1 && ` · ${attemptsByUser} intentos`}
            </p>
          </div>
        </div>
      </div>

      <GradingForm
        key={attempt.gradedAt?.toISOString() ?? "pending"}
        attemptId={attempt.id}
        status={attempt.status}
        passingScore={attempt.quiz.passingScore}
        currentScore={attempt.score}
        questions={questions.map((q) => {
          const a = answers.get(q.id);
          return {
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            points: q.points,
            acceptedAnswers: q.acceptedAnswers,
            options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
            answer: a
              ? { selectedOptionIds: a.selectedOptionIds, textAnswer: a.textAnswer, pointsAwarded: a.pointsAwarded, feedback: a.feedback }
              : null,
            autoPoints: q.type === "ESSAY" ? null : (auto.perQuestion[q.id]?.pointsAwarded ?? 0),
            autoCorrect: q.type === "ESSAY" ? null : (auto.perQuestion[q.id]?.isCorrect ?? false),
          };
        })}
      />
    </div>
  );
}
