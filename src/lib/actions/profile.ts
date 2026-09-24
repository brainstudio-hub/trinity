"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { BCRYPT_COST } from "@/lib/domain/password";
import { formDataToObject, passwordSchema, type ActionState } from "@/lib/validation";

const profileSchema = z.object({
  name: z.string().trim().min(3, "Escribe tu nombre completo.").max(120),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https:\/\//.test(v), "Usa un enlace https a una imagen.")
    .optional(),
});

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró. Ingresa de nuevo." };
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        headline: parsed.data.headline || null,
        bio: parsed.data.bio || null,
        avatarUrl: parsed.data.avatarUrl || null,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Perfil actualizado." };
  } catch (error) {
    console.error("[profile] update", error);
    return { error: "No se pudo actualizar tu perfil." };
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Las contraseñas no coinciden." });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró. Ingresa de nuevo." };
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
    if (!(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
      return { fieldErrors: { currentPassword: ["La contraseña actual no es correcta."] } };
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_COST) },
    });
    return { ok: true, message: "Contraseña actualizada." };
  } catch (error) {
    console.error("[profile] password", error);
    return { error: "No se pudo cambiar la contraseña." };
  }
}
