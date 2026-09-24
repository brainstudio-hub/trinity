"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { planReorder, validateReorder } from "@/lib/domain/curriculum";
import {
  GENERIC,
  NO_SESSION,
  NOT_FOUND,
  courseOfLesson,
  courseOfModule,
  fail,
  firstIssue,
  revalidateCourse,
  staffForCourse,
} from "./guard";
import { LESSON_TYPES, id, optionalText, requiredText } from "./schemas";
import type { ActionResult } from "./types";

// ── Módulos ────────────────────────────────────────────────────
const moduleSchema = z.object({
  title: requiredText(160, "Escribe el nombre del módulo."),
  description: optionalText(2000, "La descripción"),
});

export async function createModuleAction(
  courseId: string,
  input: z.input<typeof moduleSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    const last = await db.module.aggregate({ where: { courseId }, _max: { position: true } });
    const mod = await db.module.create({
      data: { courseId, ...parsed.data, position: (last._max.position ?? -1) + 1 },
      select: { id: true },
    });
    await revalidateCourse(courseId);
    return { ok: true, id: mod.id };
  } catch (error) {
    console.error("[admin] createModule", error);
    return GENERIC("crear el módulo");
  }
}

export async function updateModuleAction(moduleId: string, input: z.input<typeof moduleSchema>): Promise<ActionResult> {
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const courseId = await courseOfModule(moduleId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    await db.module.update({ where: { id: moduleId }, data: parsed.data });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] updateModule", error);
    return GENERIC("guardar el módulo");
  }
}

export async function deleteModuleAction(moduleId: string): Promise<ActionResult> {
  try {
    const courseId = await courseOfModule(moduleId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    await db.module.delete({ where: { id: moduleId } });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteModule", error);
    return GENERIC("eliminar el módulo");
  }
}

export async function publishModuleAction(moduleId: string, isPublished = true): Promise<ActionResult<{ count: number }>> {
  try {
    const courseId = await courseOfModule(moduleId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    const res = await db.lesson.updateMany({ where: { moduleId, isPublished: !isPublished }, data: { isPublished } });
    await revalidateCourse(courseId);
    return { ok: true, count: res.count };
  } catch (error) {
    console.error("[admin] publishModule", error);
    return GENERIC("actualizar las lecciones del módulo");
  }
}

// ── Lecciones ──────────────────────────────────────────────────
const lessonSchema = z.object({
  title: requiredText(200, "Escribe el título de la lección."),
  type: z.enum(LESSON_TYPES),
});

export async function createLessonAction(
  moduleId: string,
  input: z.input<typeof lessonSchema>
): Promise<ActionResult<{ id: string; courseId: string }>> {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const courseId = await courseOfModule(moduleId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;

    const last = await db.lesson.aggregate({ where: { moduleId }, _max: { position: true } });
    const isAssessment = parsed.data.type === "QUIZ" || parsed.data.type === "ASSIGNMENT";
    const lesson = await db.lesson.create({
      data: {
        moduleId,
        title: parsed.data.title,
        type: parsed.data.type,
        position: (last._max.position ?? -1) + 1,
        ...(isAssessment ? { quiz: { create: {} } } : {}),
      },
      select: { id: true },
    });
    await revalidateCourse(courseId);
    return { ok: true, id: lesson.id, courseId };
  } catch (error) {
    console.error("[admin] createLesson", error);
    return GENERIC("crear la lección");
  }
}

export async function deleteLessonAction(lessonId: string): Promise<ActionResult> {
  try {
    const courseId = await courseOfLesson(lessonId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    await db.lesson.delete({ where: { id: lessonId } });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteLesson", error);
    return GENERIC("eliminar la lección");
  }
}

export async function setLessonFlagsAction(
  lessonId: string,
  flags: { isPublished?: boolean; isFreePreview?: boolean }
): Promise<ActionResult> {
  const parsed = z.object({ isPublished: z.boolean().optional(), isFreePreview: z.boolean().optional() }).safeParse(flags);
  if (!parsed.success) return fail("Datos no válidos.");
  try {
    const courseId = await courseOfLesson(lessonId);
    if (!courseId) return NOT_FOUND;
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    await db.lesson.update({ where: { id: lessonId }, data: parsed.data });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] setLessonFlags", error);
    return GENERIC("actualizar la lección");
  }
}

// ── Orden (módulos y lecciones, incluido mover entre módulos) ──
const orderSchema = z.array(z.object({ id, lessonIds: z.array(id).max(500) })).max(200);

export async function reorderCurriculumAction(
  courseId: string,
  order: z.input<typeof orderSchema>
): Promise<ActionResult> {
  const parsed = orderSchema.safeParse(order);
  if (!parsed.success) return fail("El orden enviado no es válido.");
  try {
    if (!(await staffForCourse(courseId))) return NO_SESSION;

    const modules = await db.module.findMany({
      where: { courseId },
      select: { id: true, lessons: { select: { id: true } } },
    });
    const current = modules.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) }));
    const problem = validateReorder(current, parsed.data);
    if (problem) return fail(problem);

    const plan = planReorder(parsed.data);
    await db.$transaction([
      ...plan.modules.map((m) => db.module.update({ where: { id: m.id }, data: { position: m.position } })),
      ...plan.lessons.map((l) =>
        db.lesson.update({ where: { id: l.id }, data: { moduleId: l.moduleId, position: l.position } })
      ),
    ]);
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] reorderCurriculum", error);
    return GENERIC("guardar el nuevo orden");
  }
}
