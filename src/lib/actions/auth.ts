"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { layoutEmail, sendEmail } from "@/lib/email";
import { createPasswordResetLink } from "@/lib/auth-tokens";
import { BCRYPT_COST, hashToken } from "@/lib/domain/password";
import {
  emailSchema,
  formDataToObject,
  loginSchema,
  registerSchema,
  resetSchema,
  safeRedirect,
  type ActionState,
} from "@/lib/validation";

function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function isRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message === "NEXT_REDIRECT";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const data = formDataToObject(formData);
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const limit = rateLimit(`login:${clientIp()}:${parsed.data.email}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(limit.retryAfterSeconds / 60)} minutos.` };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirect(data.callbackUrl),
    });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      if (code === "inactive") return { error: "Tu cuenta está suspendida. Escribe a la coordinación académica." };
      return { error: "El correo o la contraseña no son correctos." };
    }
    console.error("[auth] login", error);
    return { error: "No pudimos iniciar sesión. Intenta de nuevo en un momento." };
  }
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return { error: "El registro está cerrado. Solicita una invitación a la coordinación académica." };
  }

  const data = formDataToObject(formData);
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const limit = rateLimit(`register:${clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: "Demasiados registros desde esta conexión. Intenta más tarde." };

  const { name, email, password } = parsed.data;
  try {
    const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return { fieldErrors: { email: ["Ya existe una cuenta con este correo."] } };

    await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, BCRYPT_COST), role: "STUDENT" },
    });
  } catch (error) {
    console.error("[auth] register", error);
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo en un momento." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/inicio?bienvenida=1" });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: true, message: "Tu cuenta fue creada. Ya puedes ingresar." };
  }
}

const GENERIC_RESET_MESSAGE =
  "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.";

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues.map((i) => i.message) } };

  const limit = rateLimit(`reset:${clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: "Demasiadas solicitudes. Intenta más tarde." };

  try {
    const user = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true, name: true, isActive: true } });
    if (user?.isActive) {
      const link = await createPasswordResetLink(user.id);
      await sendEmail({
        to: parsed.data,
        subject: "Restablece tu contraseña — Campus Trinity",
        text: `Hola ${user.name},\n\nPara crear una nueva contraseña abre este enlace (válido por 1 hora):\n${link}\n\nSi no lo solicitaste, ignora este mensaje.`,
        html: layoutEmail(
          "Restablece tu contraseña",
          `<p style="font-size:14px;line-height:1.6">Hola ${user.name},</p>
           <p style="font-size:14px;line-height:1.6">Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace es válido por una hora.</p>
           <p style="margin:28px 0"><a href="${link}" style="background:#00243A;color:#FFF8F1;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Crear nueva contraseña</a></p>
           <p style="font-size:12px;color:#6B6356">Si no hiciste esta solicitud, puedes ignorar este mensaje.</p>`
        ),
      });
    }
    return { ok: true, message: GENERIC_RESET_MESSAGE };
  } catch (error) {
    console.error("[auth] reset request", error);
    return { error: "No pudimos procesar la solicitud. Intenta de nuevo en un momento." };
  }
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { error: "El enlace no es válido o ya expiró. Solicita uno nuevo." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      db.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true, message: "Tu contraseña fue actualizada. Ya puedes ingresar." };
  } catch (error) {
    console.error("[auth] reset", error);
    return { error: "No pudimos actualizar la contraseña. Intenta de nuevo." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
