"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/session";
import { mergeWatchedSeconds, shouldAutoComplete } from "@/lib/domain/progress";
import { gradeAttempt, type SubmittedAnswer } from "@/lib/domain/quiz";
import { issueCertificateIfEligible } from "@/lib/certificates";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const UNAUTHORIZED: Result<never> = { ok: false, error: "Tu sesión expiró. Ingresa de nuevo." };

async function lessonAccess(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      durationSeconds: true,
      isFreePreview: true,
      isPublished: true,
      type: true,
      module: { select: { courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!lesson || !lesson.isPublished) return null;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
    select: { id: true, status: true },
  });
  return { lesson, enrollment };
}

// ── Inscripción ────────────────────────────────────────────────
export async function enrollAction(courseId: string): Promise<Result<{ slug: string; lessonId: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        slug: true,
        status: true,
        modules: {
          orderBy: { position: "asc" },
          select: { lessons: { where: { isPublished: true }, orderBy: { position: "asc" }, take: 1, select: { id: true } } },
        },
      },
    });
    if (!course || (course.status !== "PUBLISHED" && !isStaff(user.role))) {
      return { ok: false, error: "Este curso no está disponible para inscripción." };
    }
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: {},
      create: { userId: user.id, courseId },
    });
    revalidatePath("/inicio");
    revalidatePath("/mis-cursos");
    const first = course.modules.flatMap((m) => m.lessons)[0]?.id ?? null;
    return { ok: true, data: { slug: course.slug, lessonId: first } };
  } catch (error) {
    console.error("[learning] enroll", error);
    return { ok: false, error: "No pudimos completar la inscripción. Intenta de nuevo." };
  }
}

// ── Progreso de video ──────────────────────────────────────────
const progressSchema = z.object({
  lessonId: z.string().min(1),
  positionSeconds: z.number().min(0).max(60 * 60 * 24),
  watchedSeconds: z.number().min(0).max(60 * 60 * 24),
  durationSeconds: z.number().min(0).max(60 * 60 * 24).optional(),
});

export async function saveProgressAction(input: z.infer<typeof progressSchema>): Promise<Result<{ completed: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de progreso inválidos." };

  try {
    const access = await lessonAccess(user.id, parsed.data.lessonId);
    if (!access?.enrollment) return { ok: false, error: "No estás inscrito en este curso." };
    const { lesson } = access;

    // Si la lección aún no tiene duración registrada, usar la que reporta el reproductor.
    let duration = lesson.durationSeconds;
    if (duration === 0 && parsed.data.durationSeconds && parsed.data.durationSeconds > 0) {
      duration = Math.round(parsed.data.durationSeconds);
      await db.lesson.update({ where: { id: lesson.id }, data: { durationSeconds: duration } });
    }

    const prev = await db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    });
    const watched = mergeWatchedSeconds({
      previous: prev?.watchedSeconds ?? 0,
      reported: parsed.data.watchedSeconds,
      durationSeconds: duration,
    });
    const autoComplete = !prev?.isCompleted && shouldAutoComplete({ watchedSeconds: watched, durationSeconds: duration });

    await db.$transaction([
      db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: {
          lastPositionSeconds: Math.floor(parsed.data.positionSeconds),
          watchedSeconds: watched,
          ...(autoComplete ? { isCompleted: true, completedAt: new Date() } : {}),
        },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          lastPositionSeconds: Math.floor(parsed.data.positionSeconds),
          watchedSeconds: watched,
          isCompleted: autoComplete,
          completedAt: autoComplete ? new Date() : null,
        },
      }),
      db.enrollment.update({
        where: { id: access.enrollment.id },
        data: { lastLessonId: lesson.id, lastAccessedAt: new Date() },
      }),
    ]);

    if (autoComplete) await issueCertificateIfEligible(user.id, lesson.module.courseId);
    return { ok: true, data: { completed: autoComplete || !!prev?.isCompleted } };
  } catch (error) {
    console.error("[learning] progress", error);
    return { ok: false, error: "No se pudo guardar el progreso." };
  }
}

export async function setLessonCompleteAction(lessonId: string, completed: boolean): Promise<Result<{ certificateCode: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    const access = await lessonAccess(user.id, lessonId);
    if (!access?.enrollment) return { ok: false, error: "No estás inscrito en este curso." };
    if (completed && (access.lesson.type === "QUIZ")) {
      const passed = await db.quizAttempt.count({
        where: { userId: user.id, quiz: { lessonId }, passed: true },
      });
      if (!passed) return { ok: false, error: "Aprueba el cuestionario para completar esta lección." };
    }

    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { isCompleted: completed, completedAt: completed ? new Date() : null },
      create: { userId: user.id, lessonId, isCompleted: completed, completedAt: completed ? new Date() : null },
    });
    await db.enrollment.update({
      where: { id: access.enrollment.id },
      data: { lastLessonId: lessonId, lastAccessedAt: new Date() },
    });

    const cert = completed ? await issueCertificateIfEligible(user.id, access.lesson.module.courseId) : null;
    revalidatePath(`/aprender/${access.lesson.module.course.slug}`, "layout");
    revalidatePath("/inicio");
    return { ok: true, data: { certificateCode: cert?.code ?? null } };
  } catch (error) {
    console.error("[learning] complete", error);
    return { ok: false, error: "No se pudo actualizar la lección." };
  }
}

// ── Notas ──────────────────────────────────────────────────────
const noteSchema = z.object({
  lessonId: z.string().min(1),
  content: z.string().trim().min(1, "La nota está vacía.").max(5000, "La nota es demasiado larga."),
  timestampSeconds: z.number().int().min(0).nullable(),
});

export async function createNoteAction(input: z.infer<typeof noteSchema>) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  try {
    const access = await lessonAccess(user.id, parsed.data.lessonId);
    if (!access || (!access.enrollment && !access.lesson.isFreePreview && !isStaff(user.role))) {
      return { ok: false as const, error: "No tienes acceso a esta lección." };
    }
    const note = await db.note.create({ data: { ...parsed.data, userId: user.id } });
    revalidatePath("/notas");
    return { ok: true as const, data: note };
  } catch (error) {
    console.error("[learning] note create", error);
    return { ok: false as const, error: "No se pudo guardar la nota." };
  }
}

export async function updateNoteAction(noteId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const text = content.trim();
  if (!text) return { ok: false as const, error: "La nota está vacía." };
  if (text.length > 5000) return { ok: false as const, error: "La nota es demasiado larga." };
  try {
    const res = await db.note.updateMany({ where: { id: noteId, userId: user.id }, data: { content: text } });
    if (!res.count) return { ok: false as const, error: "La nota no existe." };
    revalidatePath("/notas");
    return { ok: true as const };
  } catch (error) {
    console.error("[learning] note update", error);
    return { ok: false as const, error: "No se pudo actualizar la nota." };
  }
}

export async function deleteNoteAction(noteId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    await db.note.deleteMany({ where: { id: noteId, userId: user.id } });
    revalidatePath("/notas");
    return { ok: true };
  } catch (error) {
    console.error("[learning] note delete", error);
    return { ok: false, error: "No se pudo eliminar la nota." };
  }
}

// ── Marcadores ─────────────────────────────────────────────────
export async function toggleBookmarkAction(lessonId: string): Promise<Result<{ bookmarked: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    const key = { userId_lessonId: { userId: user.id, lessonId } };
    const existing = await db.bookmark.findUnique({ where: key });
    if (existing) await db.bookmark.delete({ where: key });
    else await db.bookmark.create({ data: { userId: user.id, lessonId } });
    return { ok: true, data: { bookmarked: !existing } };
  } catch (error) {
    console.error("[learning] bookmark", error);
    return { ok: false, error: "No se pudo actualizar el marcador." };
  }
}

// ── Evaluaciones ───────────────────────────────────────────────
const submitSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.record(
    z.object({
      selectedOptionIds: z.array(z.string()).max(20).optional(),
      textAnswer: z.string().max(20000).optional(),
    })
  ),
});

export async function submitQuizAction(input: z.infer<typeof submitSchema>): Promise<
  Result<{ attemptId: string; score: number | null; passed: boolean | null; needsManualGrading: boolean; certificateCode: string | null }>
> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Respuestas inválidas." };

  try {
    const access = await lessonAccess(user.id, parsed.data.lessonId);
    if (!access?.enrollment) return { ok: false, error: "Inscríbete en el curso para presentar evaluaciones." };

    const quiz = await db.quiz.findUnique({
      where: { lessonId: parsed.data.lessonId },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) return { ok: false, error: "Esta lección no tiene evaluación." };

    if (quiz.maxAttempts) {
      const used = await db.quizAttempt.count({ where: { quizId: quiz.id, userId: user.id, status: { not: "IN_PROGRESS" } } });
      if (used >= quiz.maxAttempts) return { ok: false, error: "Ya usaste todos los intentos disponibles." };
    }

    // Validar que las opciones pertenezcan a cada pregunta
    const answers: Record<string, SubmittedAnswer> = {};
    for (const q of quiz.questions) {
      const a = parsed.data.answers[q.id];
      if (!a) continue;
      const valid = new Set(q.options.map((o) => o.id));
      answers[q.id] = {
        selectedOptionIds: (a.selectedOptionIds ?? []).filter((id) => valid.has(id)),
        textAnswer: a.textAnswer?.trim() || null,
      };
    }

    const grade = gradeAttempt(quiz.questions, answers, quiz.passingScore);
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        status: grade.needsManualGrading ? "SUBMITTED" : "GRADED",
        score: grade.score,
        passed: grade.passed,
        submittedAt: new Date(),
        gradedAt: grade.needsManualGrading ? null : new Date(),
        answers: {
          create: quiz.questions.map((q) => ({
            questionId: q.id,
            selectedOptionIds: answers[q.id]?.selectedOptionIds ?? [],
            textAnswer: answers[q.id]?.textAnswer ?? null,
            pointsAwarded: grade.perQuestion[q.id]?.pointsAwarded ?? null,
          })),
        },
      },
    });

    // Aprobado → lección completa. Entrega de tarea → completa (queda pendiente de calificación).
    const completes = grade.passed === true || (grade.needsManualGrading && access.lesson.type === "ASSIGNMENT");
    let certificateCode: string | null = null;
    if (completes) {
      await db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: parsed.data.lessonId } },
        update: { isCompleted: true, completedAt: new Date() },
        create: { userId: user.id, lessonId: parsed.data.lessonId, isCompleted: true, completedAt: new Date() },
      });
      const cert = await issueCertificateIfEligible(user.id, access.lesson.module.courseId);
      certificateCode = cert?.code ?? null;
    }
    await db.enrollment.update({
      where: { id: access.enrollment.id },
      data: { lastLessonId: parsed.data.lessonId, lastAccessedAt: new Date() },
    });

    revalidatePath(`/aprender/${access.lesson.module.course.slug}`, "layout");
    return {
      ok: true,
      data: {
        attemptId: attempt.id,
        score: grade.score,
        passed: grade.passed,
        needsManualGrading: grade.needsManualGrading,
        certificateCode,
      },
    };
  } catch (error) {
    console.error("[learning] submit quiz", error);
    return { ok: false, error: "No se pudo enviar la evaluación. Tus respuestas siguen en pantalla; intenta de nuevo." };
  }
}

export type AttemptReview = {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  score: number | null;
  passed: boolean | null;
  submittedAt: Date | null;
  questions: {
    id: string;
    type: string;
    prompt: string;
    points: number;
    explanation: string | null;
    options: { id: string; text: string; isCorrect: boolean | null; selected: boolean }[];
    textAnswer: string | null;
    pointsAwarded: number | null;
    feedback: string | null;
    acceptedAnswers: string[];
  }[];
};

/** Revisión de un intento propio. Las respuestas correctas solo se revelan si el cuestionario lo permite. */
export async function getAttemptReviewAction(attemptId: string): Promise<Result<AttemptReview>> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } },
          },
        },
      },
    });
    if (!attempt || attempt.userId !== user.id) return { ok: false, error: "No encontramos este intento." };

    const reveal = attempt.quiz.showAnswers && attempt.status !== "IN_PROGRESS";
    const byQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
    return {
      ok: true,
      data: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt,
        questions: attempt.quiz.questions.map((q) => {
          const a = byQuestion.get(q.id);
          const selected = new Set(a?.selectedOptionIds ?? []);
          return {
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            points: q.points,
            explanation: reveal ? q.explanation : null,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: reveal ? o.isCorrect : null,
              selected: selected.has(o.id),
            })),
            textAnswer: a?.textAnswer ?? null,
            pointsAwarded: a?.pointsAwarded ?? null,
            feedback: a?.feedback ?? null,
            acceptedAnswers: reveal ? q.acceptedAnswers : [],
          };
        }),
      },
    };
  } catch (error) {
    console.error("[learning] review attempt", error);
    return { ok: false, error: "No se pudo cargar la revisión." };
  }
}

// ── Reseñas ────────────────────────────────────────────────────
const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function upsertReviewAction(input: z.infer<typeof reviewSchema>): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Selecciona una calificación de 1 a 5." };
  try {
    const enrolled = await db.enrollment.count({ where: { userId: user.id, courseId: parsed.data.courseId } });
    if (!enrolled) return { ok: false, error: "Solo los estudiantes inscritos pueden reseñar el curso." };
    const { courseId, rating, comment } = parsed.data;
    await db.review.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: { rating, comment: comment || null },
      create: { userId: user.id, courseId, rating, comment: comment || null },
    });
    const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    if (course) revalidatePath(`/cursos/${course.slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[learning] review", error);
    return { ok: false, error: "No se pudo guardar tu reseña." };
  }
}

// ── Preguntas y respuestas ─────────────────────────────────────
const commentSchema = z.object({
  lessonId: z.string().min(1),
  body: z.string().trim().min(2, "Escribe tu pregunta o comentario.").max(4000),
  parentId: z.string().nullable(),
});

export async function addCommentAction(input: z.infer<typeof commentSchema>): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const access = await lessonAccess(user.id, parsed.data.lessonId);
    if (!access || (!access.enrollment && !isStaff(user.role))) return { ok: false, error: "No tienes acceso a esta lección." };
    if (parsed.data.parentId) {
      const parent = await db.comment.findUnique({ where: { id: parsed.data.parentId }, select: { lessonId: true, parentId: true } });
      if (!parent || parent.lessonId !== parsed.data.lessonId || parent.parentId) {
        return { ok: false, error: "No se puede responder a ese comentario." };
      }
    }
    await db.comment.create({ data: { ...parsed.data, userId: user.id } });
    revalidatePath(`/aprender/${access.lesson.module.course.slug}/${parsed.data.lessonId}`);
    return { ok: true };
  } catch (error) {
    console.error("[learning] comment", error);
    return { ok: false, error: "No se pudo publicar el comentario." };
  }
}

export async function deleteCommentAction(commentId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED;
  try {
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, lesson: { select: { id: true, module: { select: { course: { select: { slug: true } } } } } } },
    });
    if (!comment) return { ok: true };
    if (comment.userId !== user.id && !isStaff(user.role)) return { ok: false, error: "No puedes eliminar este comentario." };
    await db.comment.delete({ where: { id: commentId } });
    revalidatePath(`/aprender/${comment.lesson.module.course.slug}/${comment.lesson.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[learning] comment delete", error);
    return { ok: false, error: "No se pudo eliminar el comentario." };
  }
}
