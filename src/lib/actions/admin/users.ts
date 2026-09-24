"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createPasswordResetLink } from "@/lib/auth-tokens";
import { BCRYPT_COST } from "@/lib/domain/password";
import { checkUserChange } from "@/lib/domain/user-guard";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { GENERIC, NO_SESSION, NOT_FOUND, fail, firstIssue, getAdmin, isUniqueViolation } from "./guard";
import { ROLES, requiredText } from "./schemas";
import type { ActionResult } from "./types";

function revalidateUsers(userId?: string) {
  revalidatePath("/admin/usuarios");
  if (userId) revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/admin/docentes");
}

const createSchema = z.object({
  name: requiredText(120, "Escribe el nombre completo.").pipe(z.string().min(3, "Escribe el nombre completo.")),
  email: emailSchema,
  role: z.enum(ROLES),
  password: passwordSchema,
});

export async function createUserAction(input: z.input<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return NO_SESSION;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    const exists = await db.user.count({ where: { email: parsed.data.email } });
    if (exists) return fail("Ya existe una cuenta con ese correo.");
    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
    const user = await db.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash },
      select: { id: true },
    });
    revalidateUsers();
    return { ok: true, id: user.id };
  } catch (error) {
    if (isUniqueViolation(error, "email")) return fail("Ya existe una cuenta con ese correo.");
    console.error("[admin] createUser", error);
    return GENERIC("crear la cuenta");
  }
}

const changeSchema = z.object({ role: z.enum(ROLES).optional(), isActive: z.boolean().optional() });

export async function updateUserAccessAction(
  userId: string,
  change: z.input<typeof changeSchema>
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NO_SESSION;
  const parsed = changeSchema.safeParse(change);
  if (!parsed.success || (parsed.data.role === undefined && parsed.data.isActive === undefined)) {
    return fail("Cambio no válido.");
  }
  try {
    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
    if (!target) return NOT_FOUND;
    const activeAdminCount = await db.user.count({ where: { role: "ADMIN", isActive: true } });
    const problem = checkUserChange({ actorId: admin.id, target, change: parsed.data, activeAdminCount });
    if (problem) return fail(problem);

    await db.user.update({ where: { id: userId }, data: parsed.data });
    revalidateUsers(userId);
    return { ok: true };
  } catch (error) {
    console.error("[admin] updateUserAccess", error);
    return GENERIC("actualizar la cuenta");
  }
}

export async function generateResetLinkAction(userId: string): Promise<ActionResult<{ url: string }>> {
  const admin = await getAdmin();
  if (!admin) return NO_SESSION;
  try {
    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return NOT_FOUND;
    const url = await createPasswordResetLink(target.id);
    return { ok: true, url };
  } catch (error) {
    console.error("[admin] generateResetLink", error);
    return GENERIC("generar el enlace de restablecimiento");
  }
}
