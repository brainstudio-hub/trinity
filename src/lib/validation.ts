import { z } from "zod";
import { passwordIssues } from "@/lib/domain/password";

export const emailSchema = z
  .string({ required_error: "Ingresa tu correo." })
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo.")
  .email("Ingresa un correo válido.");

export const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const message of passwordIssues(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Escribe tu nombre completo.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const resetSchema = z
  .object({
    token: z.string().min(20),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") obj[key] = value;
  });
  return obj;
}

/** Solo rutas internas para evitar redirecciones abiertas. */
export function safeRedirect(target: string | null | undefined, fallback = "/inicio"): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}
