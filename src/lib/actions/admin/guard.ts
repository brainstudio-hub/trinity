import "server-only";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { canManageCourse, getCurrentUser, isStaff, type CurrentUser } from "@/lib/session";
import type { Fail } from "./types";

// Helpers internos para las acciones de administración. No es un archivo "use server":
// nada de aquí se expone como endpoint.

export const fail = (error: string): Fail => ({ ok: false, error });

export const NO_SESSION = fail("Tu sesión expiró o no tienes permisos para esta acción.");
export const NOT_FOUND = fail("No encontramos el elemento solicitado. Recarga la página.");
export const GENERIC = (what: string) => fail(`No pudimos ${what}. Intenta de nuevo en un momento.`);

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos del formulario.";
}

export async function getStaff(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && isStaff(user.role) ? user : null;
}

export async function getAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

/** Sesión de staff con permiso sobre el curso, o null. */
export async function staffForCourse(courseId: string): Promise<CurrentUser | null> {
  const user = await getStaff();
  if (!user || !courseId) return null;
  return (await canManageCourse(user, courseId)) ? user : null;
}

export async function courseOfModule(moduleId: string) {
  const mod = await db.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  return mod?.courseId ?? null;
}

export async function courseOfLesson(lessonId: string) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } });
  return lesson?.module.courseId ?? null;
}

/** Revalida el panel del curso y sus páginas públicas. */
export async function revalidateCourse(courseId: string, extraSlugs: string[] = []) {
  try {
    const course = await db.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    const slugs = new Set([...(course ? [course.slug] : []), ...extraSlugs]);
    revalidatePath(`/admin/cursos/${courseId}`, "layout");
    revalidatePath("/admin/cursos");
    revalidatePath("/admin");
    for (const slug of Array.from(slugs)) {
      revalidatePath(`/cursos/${slug}`);
      revalidatePath(`/aprender/${slug}`, "layout");
    }
    revalidatePath("/cursos");
  } catch (error) {
    console.error("[admin] revalidateCourse", error);
  }
}

export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (typeof error !== "object" || error === null || (error as { code?: string }).code !== "P2002") return false;
  if (!field) return true;
  const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
  return Array.isArray(target) ? target.includes(field) : typeof target === "string" ? target.includes(field) : true;
}
