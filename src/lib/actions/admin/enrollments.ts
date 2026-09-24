"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validation";
import { GENERIC, NO_SESSION, NOT_FOUND, fail, firstIssue, revalidateCourse, staffForCourse } from "./guard";
import type { ActionResult } from "./types";

export async function enrollByEmailAction(courseId: string, email: string): Promise<ActionResult<{ name: string }>> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    if (!(await staffForCourse(courseId))) return NO_SESSION;
    const student = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true, name: true, isActive: true } });
    if (!student) return fail("No existe una cuenta con ese correo. Pídele que se registre o créala en Usuarios.");
    if (!student.isActive) return fail("Esa cuenta está suspendida. Reactívala antes de inscribirla.");

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: student.id, courseId } },
      select: { id: true },
    });
    if (existing) return fail(`${student.name} ya está inscrito en este curso.`);

    await db.enrollment.create({ data: { userId: student.id, courseId } });
    await revalidateCourse(courseId);
    return { ok: true, name: student.name };
  } catch (error) {
    console.error("[admin] enrollByEmail", error);
    return GENERIC("inscribir al estudiante");
  }
}

async function enrollmentCourse(enrollmentId: string) {
  const e = await db.enrollment.findUnique({ where: { id: enrollmentId }, select: { courseId: true, userId: true } });
  return e;
}

export async function removeEnrollmentAction(enrollmentId: string): Promise<ActionResult> {
  try {
    const e = await enrollmentCourse(enrollmentId);
    if (!e) return NOT_FOUND;
    if (!(await staffForCourse(e.courseId))) return NO_SESSION;
    await db.enrollment.delete({ where: { id: enrollmentId } });
    await revalidateCourse(e.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] removeEnrollment", error);
    return GENERIC("quitar la inscripción");
  }
}

const statusSchema = z.enum(["ACTIVE", "SUSPENDED", "COMPLETED"]);

export async function setEnrollmentStatusAction(
  enrollmentId: string,
  status: z.infer<typeof statusSchema>
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail("Estado no válido.");
  try {
    const e = await enrollmentCourse(enrollmentId);
    if (!e) return NOT_FOUND;
    if (!(await staffForCourse(e.courseId))) return NO_SESSION;
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: parsed.data, ...(parsed.data === "COMPLETED" ? { completedAt: new Date() } : {}) },
    });
    await revalidateCourse(e.courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] setEnrollmentStatus", error);
    return GENERIC("actualizar la inscripción");
  }
}
