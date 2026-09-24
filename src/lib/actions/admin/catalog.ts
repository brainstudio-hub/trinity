"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/domain/format";
import { uniqueSlug } from "@/lib/domain/curriculum";
import { GENERIC, NO_SESSION, NOT_FOUND, fail, firstIssue, getAdmin, isUniqueViolation } from "./guard";
import { id, optionalText, optionalUrl, requiredText } from "./schemas";
import type { ActionResult } from "./types";

// ═══ Docentes ═══════════════════════════════════════════════════
const instructorSchema = z.object({
  name: requiredText(120, "Escribe el nombre del docente."),
  title: optionalText(160, "El cargo o título"),
  bio: optionalText(5000, "La biografía"),
  photoUrl: optionalUrl("La foto debe ser un enlace válido (https://…)."),
  userId: z.string().max(64).nullish().transform((v) => v || null),
});

async function validateInstructorUser(userId: string | null, selfId?: string): Promise<string | null> {
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, instructorProfile: { select: { id: true } } },
  });
  if (!user) return "La cuenta seleccionada ya no existe.";
  if (user.role === "STUDENT") return "Solo puedes vincular cuentas con rol Docente o Administrador.";
  if (user.instructorProfile && user.instructorProfile.id !== selfId) return "Esa cuenta ya está vinculada a otro perfil docente.";
  return null;
}

function revalidateInstructors() {
  revalidatePath("/admin/docentes");
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/cursos", "layout");
}

export async function saveInstructorAction(
  instructorId: string | null,
  input: z.input<typeof instructorSchema>
): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return NO_SESSION;
  const parsed = instructorSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const problem = await validateInstructorUser(parsed.data.userId, instructorId ?? undefined);
    if (problem) return fail(problem);
    if (instructorId) {
      const exists = await db.instructor.count({ where: { id: instructorId } });
      if (!exists) return NOT_FOUND;
      await db.instructor.update({ where: { id: instructorId }, data: parsed.data });
      revalidateInstructors();
      return { ok: true, id: instructorId };
    }
    const created = await db.instructor.create({ data: parsed.data, select: { id: true } });
    revalidateInstructors();
    return { ok: true, id: created.id };
  } catch (error) {
    if (isUniqueViolation(error, "userId")) return fail("Esa cuenta ya está vinculada a otro perfil docente.");
    console.error("[admin] saveInstructor", error);
    return GENERIC("guardar el perfil docente");
  }
}

export async function deleteInstructorAction(instructorId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return NO_SESSION;
  try {
    const res = await db.instructor.deleteMany({ where: { id: instructorId } });
    if (!res.count) return NOT_FOUND;
    revalidateInstructors();
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteInstructor", error);
    return GENERIC("eliminar el perfil docente");
  }
}

// ═══ Categorías ═════════════════════════════════════════════════
const categorySchema = z.object({
  name: requiredText(80, "Escribe el nombre de la categoría."),
  description: optionalText(500, "La descripción"),
});

function revalidateCategories() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/cursos", "layout");
  revalidatePath("/cursos", "layout");
}

export async function saveCategoryAction(
  categoryId: string | null,
  input: z.input<typeof categorySchema>
): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return NO_SESSION;
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const nameTaken = await db.category.count({
      where: { name: { equals: parsed.data.name, mode: "insensitive" }, ...(categoryId ? { id: { not: categoryId } } : {}) },
    });
    if (nameTaken) return fail("Ya existe una categoría con ese nombre.");

    const root = slugify(parsed.data.name) || "categoria";
    const taken = await db.category.findMany({
      where: { slug: { startsWith: root }, ...(categoryId ? { id: { not: categoryId } } : {}) },
      select: { slug: true },
    });
    const slug = uniqueSlug(root, taken.map((c) => c.slug));

    if (categoryId) {
      const exists = await db.category.count({ where: { id: categoryId } });
      if (!exists) return NOT_FOUND;
      await db.category.update({ where: { id: categoryId }, data: { ...parsed.data, slug } });
      revalidateCategories();
      return { ok: true, id: categoryId };
    }
    const last = await db.category.aggregate({ _max: { position: true } });
    const created = await db.category.create({
      data: { ...parsed.data, slug, position: (last._max.position ?? -1) + 1 },
      select: { id: true },
    });
    revalidateCategories();
    return { ok: true, id: created.id };
  } catch (error) {
    if (isUniqueViolation(error)) return fail("Ya existe una categoría con ese nombre.");
    console.error("[admin] saveCategory", error);
    return GENERIC("guardar la categoría");
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return NO_SESSION;
  try {
    const res = await db.category.deleteMany({ where: { id: categoryId } });
    if (!res.count) return NOT_FOUND;
    revalidateCategories();
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteCategory", error);
    return GENERIC("eliminar la categoría");
  }
}

export async function reorderCategoriesAction(orderedIds: string[]): Promise<ActionResult> {
  if (!(await getAdmin())) return NO_SESSION;
  const ids = z.array(id).max(300).safeParse(orderedIds);
  if (!ids.success) return fail("El orden enviado no es válido.");
  try {
    const existing = await db.category.findMany({ select: { id: true } });
    const known = new Set(existing.map((c) => c.id));
    if (ids.data.length !== known.size || ids.data.some((x) => !known.has(x)) || new Set(ids.data).size !== ids.data.length) {
      return fail("Las categorías cambiaron. Recarga la página e intenta de nuevo.");
    }
    await db.$transaction(ids.data.map((cid, position) => db.category.update({ where: { id: cid }, data: { position } })));
    revalidateCategories();
    return { ok: true };
  } catch (error) {
    console.error("[admin] reorderCategories", error);
    return GENERIC("guardar el orden");
  }
}
