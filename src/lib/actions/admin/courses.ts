"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/domain/format";
import { parseVideoUrl } from "@/lib/domain/video";
import { publishChecklist, uniqueSlug } from "@/lib/domain/curriculum";
import {
  GENERIC,
  NO_SESSION,
  NOT_FOUND,
  fail,
  firstIssue,
  getStaff,
  isUniqueViolation,
  revalidateCourse,
  staffForCourse,
} from "./guard";
import { LEVELS, id, optionalInt, optionalText, optionalUrl, requiredText } from "./schemas";
import type { ActionResult } from "./types";

async function freeSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "curso";
  const taken = await db.course.findMany({
    where: { slug: { startsWith: root }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  return uniqueSlug(root, taken.map((c) => c.slug));
}

// ── Crear ──────────────────────────────────────────────────────
const createSchema = z.object({
  title: requiredText(160, "Escribe el título del curso."),
  categoryId: z.string().max(64).nullish().transform((v) => v || null),
  level: z.enum(LEVELS),
});

export async function createCourseAction(input: z.input<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  const user = await getStaff();
  if (!user) return NO_SESSION;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    if (parsed.data.categoryId) {
      const exists = await db.category.count({ where: { id: parsed.data.categoryId } });
      if (!exists) return fail("La categoría seleccionada ya no existe.");
    }
    const profile =
      user.role === "INSTRUCTOR"
        ? await db.instructor.findUnique({ where: { userId: user.id }, select: { id: true } })
        : null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const course = await db.course.create({
          data: {
            title: parsed.data.title,
            slug: await freeSlug(parsed.data.title),
            level: parsed.data.level,
            categoryId: parsed.data.categoryId,
            status: "DRAFT",
            createdById: user.id,
            ...(profile ? { instructors: { create: { instructorId: profile.id, position: 0 } } } : {}),
          },
          select: { id: true },
        });
        revalidatePath("/admin/cursos");
        revalidatePath("/admin");
        return { ok: true, id: course.id };
      } catch (error) {
        // Carrera improbable por el slug: reintentar con uno nuevo.
        if (!isUniqueViolation(error, "slug") || attempt === 2) throw error;
      }
    }
    return GENERIC("crear el curso");
  } catch (error) {
    console.error("[admin] createCourse", error);
    return GENERIC("crear el curso");
  }
}

// ── Información ────────────────────────────────────────────────
const infoSchema = z.object({
  title: requiredText(160, "Escribe el título del curso."),
  subtitle: optionalText(240, "El subtítulo"),
  slug: z
    .string()
    .trim()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .max(80, "El slug es demasiado largo.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa solo minúsculas, números y guiones (p. ej. teologia-sistematica)."),
  code: optionalText(24, "El código"),
  description: optionalText(20000, "La descripción"),
  coverImageUrl: optionalUrl("La imagen de portada debe ser un enlace válido (https://…)."),
  trailerUrl: optionalUrl("El video de presentación debe ser un enlace válido."),
  categoryId: z.string().max(64).nullish().transform((v) => v || null),
  level: z.enum(LEVELS),
  language: requiredText(40, "Indica el idioma del curso."),
  estimatedHours: optionalInt(0, 2000, "Las horas estimadas deben ser un número entre 0 y 2000."),
  learningOutcomes: z.array(z.string().trim().max(300)).max(30).transform((a) => a.filter(Boolean)),
  requirements: z.array(z.string().trim().max(300)).max(30).transform((a) => a.filter(Boolean)),
  instructorIds: z.array(id).max(12),
  certificateEnabled: z.boolean(),
  passingScore: z.number().int().min(0, "La nota mínima va de 0 a 100.").max(100, "La nota mínima va de 0 a 100."),
});

export async function updateCourseInfoAction(
  courseId: string,
  input: z.input<typeof infoSchema>
): Promise<ActionResult<{ slug: string }>> {
  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const data = parsed.data;

  try {
    const user = await staffForCourse(courseId);
    if (!user) return NO_SESSION;

    const current = await db.course.findUnique({ where: { id: courseId }, select: { slug: true, createdById: true } });
    if (!current) return NOT_FOUND;

    if (data.trailerUrl && !parseVideoUrl(data.trailerUrl)) {
      return fail("No reconocemos el enlace del video de presentación. Usa un enlace de YouTube, Google Drive o Vimeo.");
    }

    const [slugTaken, codeTaken] = await Promise.all([
      db.course.count({ where: { slug: data.slug, id: { not: courseId } } }),
      data.code ? db.course.count({ where: { code: data.code, id: { not: courseId } } }) : Promise.resolve(0),
    ]);
    if (slugTaken) return fail("Ese slug ya lo usa otro curso. Elige uno distinto.");
    if (codeTaken) return fail("Ese código académico ya lo usa otro curso.");

    if (data.categoryId && !(await db.category.count({ where: { id: data.categoryId } }))) {
      return fail("La categoría seleccionada ya no existe.");
    }

    const instructorIds = Array.from(new Set(data.instructorIds));
    const found = await db.instructor.findMany({ where: { id: { in: instructorIds } }, select: { id: true, userId: true } });
    if (found.length !== instructorIds.length) return fail("Alguno de los docentes seleccionados ya no existe.");

    // Un docente que no creó el curso no puede quitarse a sí mismo (perdería el acceso).
    if (user.role === "INSTRUCTOR" && current.createdById !== user.id && !found.some((i) => i.userId === user.id)) {
      return fail("No puedes quitarte como docente de este curso.");
    }

    await db.$transaction([
      db.course.update({
        where: { id: courseId },
        data: {
          title: data.title,
          subtitle: data.subtitle,
          slug: data.slug,
          code: data.code,
          description: data.description,
          coverImageUrl: data.coverImageUrl,
          trailerUrl: data.trailerUrl,
          categoryId: data.categoryId,
          level: data.level,
          language: data.language,
          estimatedHours: data.estimatedHours,
          learningOutcomes: data.learningOutcomes,
          requirements: data.requirements,
          certificateEnabled: data.certificateEnabled,
          passingScore: data.passingScore,
        },
      }),
      db.courseInstructor.deleteMany({ where: { courseId } }),
      db.courseInstructor.createMany({
        data: instructorIds.map((instructorId, position) => ({ courseId, instructorId, position })),
      }),
    ]);

    await revalidateCourse(courseId, [current.slug]);
    return { ok: true, slug: data.slug };
  } catch (error) {
    if (isUniqueViolation(error, "slug")) return fail("Ese slug ya lo usa otro curso. Elige uno distinto.");
    if (isUniqueViolation(error, "code")) return fail("Ese código académico ya lo usa otro curso.");
    console.error("[admin] updateCourseInfo", error);
    return GENERIC("guardar la información del curso");
  }
}

// ── Estado ─────────────────────────────────────────────────────
const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function setCourseStatusAction(courseId: string, status: z.infer<typeof statusSchema>): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail("Estado no válido.");
  try {
    const user = await staffForCourse(courseId);
    if (!user) return NO_SESSION;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        coverImageUrl: true,
        publishedAt: true,
        modules: { select: { lessons: { select: { isPublished: true } } } },
      },
    });
    if (!course) return NOT_FOUND;

    if (parsed.data === "PUBLISHED") {
      const checklist = publishChecklist(course);
      if (!checklist.canPublish) {
        const missing = checklist.items.filter((i) => i.required && !i.ok).map((i) => i.label.toLowerCase());
        return fail(`Antes de publicar falta: ${missing.join("; ")}.`);
      }
    }

    await db.course.update({
      where: { id: courseId },
      data: {
        status: parsed.data,
        ...(parsed.data === "PUBLISHED" && !course.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] setCourseStatus", error);
    return GENERIC("cambiar el estado del curso");
  }
}

// ── Eliminar ───────────────────────────────────────────────────
export async function deleteCourseAction(courseId: string, confirmTitle: string): Promise<ActionResult> {
  try {
    const user = await staffForCourse(courseId);
    if (!user) return NO_SESSION;
    const course = await db.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true, createdById: true } });
    if (!course) return NOT_FOUND;
    if (user.role !== "ADMIN" && course.createdById !== user.id) {
      return fail("Solo un administrador o quien creó el curso puede eliminarlo.");
    }
    if (typeof confirmTitle !== "string" || confirmTitle.trim() !== course.title.trim()) {
      return fail("El título escrito no coincide con el del curso.");
    }
    await db.course.delete({ where: { id: courseId } });
    revalidatePath("/admin/cursos");
    revalidatePath("/admin");
    revalidatePath("/cursos");
    revalidatePath(`/cursos/${course.slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteCourse", error);
    return GENERIC("eliminar el curso");
  }
}
