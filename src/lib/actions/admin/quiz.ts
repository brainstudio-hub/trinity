"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { validateQuestionDraft } from "@/lib/domain/curriculum";
import { GENERIC, NO_SESSION, NOT_FOUND, courseOfLesson, fail, firstIssue, revalidateCourse, staffForCourse } from "./guard";
import { QUESTION_TYPES, id, optionalInt, optionalText } from "./schemas";
import type { ActionResult } from "./types";

async function quizForLesson(lessonId: string) {
  const courseId = await courseOfLesson(lessonId);
  if (!courseId) return null;
  if (!(await staffForCourse(courseId))) return { courseId, quizId: null, allowed: false as const };
  const quiz = await db.quiz.upsert({ where: { lessonId }, update: {}, create: { lessonId }, select: { id: true } });
  return { courseId, quizId: quiz.id, allowed: true as const };
}

// ── Configuración del cuestionario ─────────────────────────────
const settingsSchema = z.object({
  instructions: optionalText(20000, "Las instrucciones"),
  passingScore: z.number().int().min(0, "La nota mínima va de 0 a 100.").max(100, "La nota mínima va de 0 a 100."),
  maxAttempts: optionalInt(1, 100, "Los intentos deben ser un número entre 1 y 100 (o vacío para ilimitados)."),
  timeLimitMinutes: optionalInt(1, 600, "El tiempo límite debe estar entre 1 y 600 minutos (o vacío)."),
  shuffleQuestions: z.boolean(),
  showAnswers: z.boolean(),
});

export async function updateQuizSettingsAction(lessonId: string, input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const ctx = await quizForLesson(lessonId);
    if (!ctx) return NOT_FOUND;
    if (!ctx.allowed) return NO_SESSION;
    await db.quiz.update({ where: { id: ctx.quizId }, data: parsed.data });
    await revalidateCourse(ctx.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] updateQuizSettings", error);
    return GENERIC("guardar la configuración de la evaluación");
  }
}

// ── Preguntas ──────────────────────────────────────────────────
const questionSchema = z.object({
  id: id.optional(),
  type: z.enum(QUESTION_TYPES),
  prompt: z.string().trim().max(10000, "El enunciado es demasiado largo."),
  explanation: optionalText(10000, "La explicación"),
  points: z.number().int().max(1000, "Máximo 1000 puntos por pregunta."),
  options: z
    .array(z.object({ id: id.optional(), text: z.string().trim().max(1000), isCorrect: z.boolean() }))
    .max(12, "Máximo 12 opciones por pregunta."),
  acceptedAnswers: z.array(z.string().trim().max(300)).max(30),
});

export async function saveQuestionAction(
  lessonId: string,
  input: z.input<typeof questionSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const q = parsed.data;

  const hasOptions = q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE";
  // Verdadero/Falso: siempre dos opciones fijas.
  const options = !hasOptions
    ? []
    : q.type === "TRUE_FALSE"
      ? [
          { id: q.options[0]?.id, text: "Verdadero", isCorrect: !!q.options[0]?.isCorrect },
          { id: q.options[1]?.id, text: "Falso", isCorrect: !!q.options[1]?.isCorrect },
        ]
      : q.options;
  const acceptedAnswers = q.type === "SHORT_ANSWER" ? q.acceptedAnswers.filter(Boolean) : [];

  const problem = validateQuestionDraft({ type: q.type, prompt: q.prompt, points: q.points, options, acceptedAnswers });
  if (problem) return fail(problem);

  try {
    const ctx = await quizForLesson(lessonId);
    if (!ctx) return NOT_FOUND;
    if (!ctx.allowed) return NO_SESSION;
    const quizId = ctx.quizId;

    const fields = { type: q.type, prompt: q.prompt, explanation: q.explanation, points: q.points, acceptedAnswers };

    if (!q.id) {
      const last = await db.question.aggregate({ where: { quizId }, _max: { position: true } });
      const created = await db.question.create({
        data: {
          quizId,
          ...fields,
          position: (last._max.position ?? -1) + 1,
          options: { create: options.map((o, position) => ({ text: o.text, isCorrect: o.isCorrect, position })) },
        },
        select: { id: true },
      });
      await revalidateCourse(ctx.courseId);
      return { ok: true, id: created.id };
    }

    const existing = await db.question.findFirst({
      where: { id: q.id, quizId },
      select: { id: true, options: { select: { id: true } } },
    });
    if (!existing) return NOT_FOUND;

    // Conservar los ids de opciones existentes para no invalidar respuestas ya entregadas.
    const known = new Set(existing.options.map((o) => o.id));
    const keep = options.filter((o) => o.id && known.has(o.id));
    const keepIds = new Set(keep.map((o) => o.id as string));

    await db.$transaction([
      db.question.update({ where: { id: q.id }, data: fields }),
      db.questionOption.deleteMany({ where: { questionId: q.id, id: { notIn: Array.from(keepIds) } } }),
      ...options.map((o, position) =>
        o.id && keepIds.has(o.id)
          ? db.questionOption.update({ where: { id: o.id }, data: { text: o.text, isCorrect: o.isCorrect, position } })
          : db.questionOption.create({ data: { questionId: q.id!, text: o.text, isCorrect: o.isCorrect, position } })
      ),
    ]);
    await revalidateCourse(ctx.courseId);
    return { ok: true, id: q.id };
  } catch (error) {
    console.error("[admin] saveQuestion", error);
    return GENERIC("guardar la pregunta");
  }
}

export async function deleteQuestionAction(lessonId: string, questionId: string): Promise<ActionResult> {
  try {
    const ctx = await quizForLesson(lessonId);
    if (!ctx) return NOT_FOUND;
    if (!ctx.allowed) return NO_SESSION;
    const res = await db.question.deleteMany({ where: { id: questionId, quizId: ctx.quizId } });
    if (res.count === 0) return NOT_FOUND;
    await revalidateCourse(ctx.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteQuestion", error);
    return GENERIC("eliminar la pregunta");
  }
}

export async function reorderQuestionsAction(lessonId: string, orderedIds: string[]): Promise<ActionResult> {
  const ids = z.array(id).max(500).safeParse(orderedIds);
  if (!ids.success) return fail("El orden enviado no es válido.");
  try {
    const ctx = await quizForLesson(lessonId);
    if (!ctx) return NOT_FOUND;
    if (!ctx.allowed) return NO_SESSION;
    const existing = await db.question.findMany({ where: { quizId: ctx.quizId }, select: { id: true } });
    const known = new Set(existing.map((q) => q.id));
    if (ids.data.length !== known.size || new Set(ids.data).size !== ids.data.length || ids.data.some((x) => !known.has(x))) {
      return fail("Las preguntas cambiaron. Recarga la página e intenta de nuevo.");
    }
    await db.$transaction(ids.data.map((qid, position) => db.question.update({ where: { id: qid }, data: { position } })));
    await revalidateCourse(ctx.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] reorderQuestions", error);
    return GENERIC("guardar el orden de las preguntas");
  }
}
