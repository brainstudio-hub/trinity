"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { GENERIC, NO_SESSION, NOT_FOUND, fail, firstIssue, getAdmin } from "./guard";
import { EVENT_KINDS, optionalText, optionalUrl, requiredText } from "./schemas";
import type { ActionResult } from "./types";

const courseRef = z.string().max(64).nullish().transform((v) => v || null);

async function courseExists(courseId: string | null) {
  return !courseId || (await db.course.count({ where: { id: courseId } })) > 0;
}

function revalidateCommunications() {
  revalidatePath("/admin/comunicaciones");
  revalidatePath("/inicio");
  revalidatePath("/calendario");
}

// ═══ Anuncios ═══════════════════════════════════════════════════
const announcementSchema = z.object({
  title: requiredText(160, "Escribe el título del anuncio."),
  body: requiredText(10000, "Escribe el contenido del anuncio."),
  link: optionalUrl("El enlace debe ser válido (https://…)."),
  courseId: courseRef,
  isPublished: z.boolean(),
});

export async function saveAnnouncementAction(
  announcementId: string | null,
  input: z.input<typeof announcementSchema>
): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return NO_SESSION;
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    if (!(await courseExists(parsed.data.courseId))) return fail("El curso seleccionado ya no existe.");
    if (announcementId) {
      const current = await db.announcement.findUnique({ where: { id: announcementId }, select: { isPublished: true } });
      if (!current) return NOT_FOUND;
      await db.announcement.update({
        where: { id: announcementId },
        // Al publicar un borrador, la fecha de publicación pasa a ser ahora.
        data: { ...parsed.data, ...(parsed.data.isPublished && !current.isPublished ? { publishedAt: new Date() } : {}) },
      });
      revalidateCommunications();
      return { ok: true, id: announcementId };
    }
    const created = await db.announcement.create({ data: parsed.data, select: { id: true } });
    revalidateCommunications();
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[admin] saveAnnouncement", error);
    return GENERIC("guardar el anuncio");
  }
}

export async function deleteAnnouncementAction(announcementId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return NO_SESSION;
  try {
    const res = await db.announcement.deleteMany({ where: { id: announcementId } });
    if (!res.count) return NOT_FOUND;
    revalidateCommunications();
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteAnnouncement", error);
    return GENERIC("eliminar el anuncio");
  }
}

// ═══ Eventos ════════════════════════════════════════════════════
const isoDate = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Date.parse(v)), message)
    .transform((v) => new Date(v));

const eventSchema = z
  .object({
    title: requiredText(160, "Escribe el título del evento."),
    description: optionalText(5000, "La descripción"),
    kind: z.enum(EVENT_KINDS),
    startsAt: isoDate("Indica la fecha y hora de inicio."),
    endsAt: z
      .string()
      .nullish()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "La fecha de término no es válida.")
      .transform((v) => (v ? new Date(v) : null)),
    location: optionalText(500, "El lugar o enlace"),
    courseId: courseRef,
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, {
    message: "La fecha de término debe ser posterior al inicio.",
    path: ["endsAt"],
  });

export async function saveEventAction(
  eventId: string | null,
  input: z.input<typeof eventSchema>
): Promise<ActionResult<{ id: string }>> {
  if (!(await getAdmin())) return NO_SESSION;
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    if (!(await courseExists(parsed.data.courseId))) return fail("El curso seleccionado ya no existe.");
    if (eventId) {
      const exists = await db.event.count({ where: { id: eventId } });
      if (!exists) return NOT_FOUND;
      await db.event.update({ where: { id: eventId }, data: parsed.data });
      revalidateCommunications();
      return { ok: true, id: eventId };
    }
    const created = await db.event.create({ data: parsed.data, select: { id: true } });
    revalidateCommunications();
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[admin] saveEvent", error);
    return GENERIC("guardar el evento");
  }
}

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return NO_SESSION;
  try {
    const res = await db.event.deleteMany({ where: { id: eventId } });
    if (!res.count) return NOT_FOUND;
    revalidateCommunications();
    return { ok: true };
  } catch (error) {
    console.error("[admin] deleteEvent", error);
    return GENERIC("eliminar el evento");
  }
}
