"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { GENERIC, NO_SESSION, NOT_FOUND, courseOfLesson, fail, firstIssue, revalidateCourse, staffForCourse } from "./guard";
import { RESOURCE_KINDS, id, requiredText, requiredUrl } from "./schemas";
import type { ActionResult } from "./types";

const scopeSchema = z.union([z.object({ courseId: id }), z.object({ lessonId: id })]);
type Scope = z.infer<typeof scopeSchema>;

const resourceSchema = z.object({
  title: requiredText(200, "Escribe el título del recurso."),
  url: requiredUrl("El recurso necesita un enlace válido (https://…)."),
  kind: z.enum(RESOURCE_KINDS),
});

/** Devuelve el curso dueño del alcance (curso o lección) si el usuario puede gestionarlo. */
async function authorizeScope(scope: Scope): Promise<string | null> {
  const courseId = "courseId" in scope ? scope.courseId : await courseOfLesson(scope.lessonId);
  if (!courseId) return null;
  return (await staffForCourse(courseId)) ? courseId : null;
}

async function resourceCourse(resourceId: string) {
  const r = await db.resource.findUnique({
    where: { id: resourceId },
    select: { courseId: true, lessonId: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!r) return null;
  return {
    courseId: r.courseId ?? r.lesson?.module.courseId ?? null,
    scope: (r.courseId ? { courseId: r.courseId } : { lessonId: r.lessonId! }) as Scope,
  };
}

export async function addResourceAction(
  scopeInput: Scope,
  input: z.input<typeof resourceSchema>
): Promise<ActionResult<{ id: string }>> {
  const scope = scopeSchema.safeParse(scopeInput);
  const parsed = resourceSchema.safeParse(input);
  if (!scope.success) return fail("Datos no válidos.");
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const courseId = await authorizeScope(scope.data);
    if (!courseId) return NO_SESSION;
    const where = "courseId" in scope.data ? { courseId: scope.data.courseId, lessonId: null } : { lessonId: scope.data.lessonId };
    const last = await db.resource.aggregate({ where, _max: { position: true } });
    const resource = await db.resource.create({
      data: { ...parsed.data, ...scope.data, position: (last._max.position ?? -1) + 1 },
      select: { id: true },
    });
    await revalidateCourse(courseId);
    return { ok: true, id: resource.id };
  } catch (error) {
    console.error("[admin] addResource", error);
    return GENERIC("agregar el recurso");
  }
}

export async function updateResourceAction(resourceId: string, input: z.input<typeof resourceSchema>): Promise<ActionResult> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const owner = await resourceCourse(resourceId);
    if (!owner?.courseId) return NOT_FOUND;
    if (!(await staffForCourse(owner.courseId))) return NO_SESSION;
    await db.resource.update({ where: { id: resourceId }, data: parsed.data });
    await revalidateCourse(owner.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] updateResource", error);
    return GENERIC("guardar el recurso");
  }
}

export async function deleteResourceAction(resourceId: string): Promise<ActionResult> {
  try {
    const owner = await resourceCourse(resourceId);
    if (!owner?.courseId) return NOT_FOUND;
    if (!(await staffForCourse(owner.courseId))) return NO_SESSION;
    await db.resource.delete({ where: { id: resourceId } });
    await revalidateCourse(owner.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteResource", error);
    return GENERIC("eliminar el recurso");
  }
}

export async function reorderResourcesAction(scopeInput: Scope, orderedIds: string[]): Promise<ActionResult> {
  const scope = scopeSchema.safeParse(scopeInput);
  const ids = z.array(id).max(300).safeParse(orderedIds);
  if (!scope.success || !ids.success) return fail("El orden enviado no es válido.");
  try {
    const courseId = await authorizeScope(scope.data);
    if (!courseId) return NO_SESSION;
    const where = "courseId" in scope.data ? { courseId: scope.data.courseId, lessonId: null } : { lessonId: scope.data.lessonId };
    const existing = await db.resource.findMany({ where, select: { id: true } });
    const known = new Set(existing.map((r) => r.id));
    if (ids.data.length !== known.size || new Set(ids.data).size !== ids.data.length || ids.data.some((x) => !known.has(x))) {
      return fail("Los recursos cambiaron. Recarga la página e intenta de nuevo.");
    }
    await db.$transaction(ids.data.map((rid, position) => db.resource.update({ where: { id: rid }, data: { position } })));
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] reorderResources", error);
    return GENERIC("guardar el orden de los recursos");
  }
}
