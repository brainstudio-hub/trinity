import { z } from "zod";

/** Texto opcional: cadena vacía → null. */
export const optionalText = (max: number, label = "Este campo") =>
  z
    .string()
    .trim()
    .max(max, `${label} es demasiado largo (máx. ${max} caracteres).`)
    .nullish()
    .transform((v) => (v ? v : null));

export const requiredText = (max: number, message: string) =>
  z.string({ required_error: message }).trim().min(1, message).max(max, `Máximo ${max} caracteres.`);

/** URL http(s) opcional: cadena vacía → null. */
export const optionalUrl = (message = "Ingresa un enlace válido (https://…).") =>
  z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), message);

export const requiredUrl = (message = "Ingresa un enlace válido (https://…).") =>
  z.string().trim().max(2000).regex(/^https?:\/\/\S+$/i, message);

export const id = z.string().min(1).max(64);

export const optionalInt = (min: number, max: number, message: string) =>
  z
    .number()
    .int(message)
    .min(min, message)
    .max(max, message)
    .nullish()
    .transform((v) => (v === undefined ? null : v));

export const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export const LEVELS = ["INTRODUCTORIO", "INTERMEDIO", "AVANZADO"] as const;
export const LESSON_TYPES = ["VIDEO", "READING", "QUIZ", "ASSIGNMENT"] as const;
export const RESOURCE_KINDS = ["PDF", "LINK", "FILE", "AUDIO"] as const;
export const QUESTION_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"] as const;
export const EVENT_KINDS = ["LIVE_CLASS", "DEADLINE", "SERVICE", "OTHER"] as const;
