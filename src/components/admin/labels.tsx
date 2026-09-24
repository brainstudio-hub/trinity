import type { ComponentType } from "react";
import { ClipboardList, FileText, ListChecks, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type CourseStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type LessonTypeValue = "VIDEO" | "READING" | "QUIZ" | "ASSIGNMENT";
export type RoleValue = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export const COURSE_STATUS: Record<CourseStatusValue, { label: string; variant: "muted" | "success" | "outline" }> = {
  DRAFT: { label: "Borrador", variant: "muted" },
  PUBLISHED: { label: "Publicado", variant: "success" },
  ARCHIVED: { label: "Archivado", variant: "outline" },
};

export function CourseStatusBadge({ status, className }: { status: CourseStatusValue; className?: string }) {
  const s = COURSE_STATUS[status];
  return (
    <Badge variant={s.variant} className={className}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "PUBLISHED" ? "bg-success" : status === "DRAFT" ? "bg-tas-taupe/60" : "bg-muted-foreground/40"
        )}
        aria-hidden
      />
      {s.label}
    </Badge>
  );
}

export const LEVEL_OPTIONS = [
  { value: "INTRODUCTORIO", label: "Introductorio" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZADO", label: "Avanzado" },
] as const;

export const LESSON_TYPES: Record<
  LessonTypeValue,
  { label: string; description: string; icon: ComponentType<{ className?: string }>; tone: string }
> = {
  VIDEO: {
    label: "Video",
    description: "Clase grabada de YouTube, Google Drive o Vimeo, con bosquejo y notas.",
    icon: PlayCircle,
    tone: "bg-tas-blue/10 text-tas-blue",
  },
  READING: {
    label: "Lectura",
    description: "Texto en formato markdown: artículos, bosquejos o guías de estudio.",
    icon: FileText,
    tone: "bg-tas-gold-soft text-[#7A5600]",
  },
  QUIZ: {
    label: "Cuestionario",
    description: "Preguntas con calificación automática (y ensayos opcionales).",
    icon: ListChecks,
    tone: "bg-success/10 text-success",
  },
  ASSIGNMENT: {
    label: "Tarea",
    description: "Entrega escrita que el docente califica manualmente.",
    icon: ClipboardList,
    tone: "bg-tas-crimson/10 text-tas-crimson-dark",
  },
};

export function LessonTypeIcon({ type, className }: { type: LessonTypeValue; className?: string }) {
  const t = LESSON_TYPES[type];
  const Icon = t.icon;
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-md", t.tone, className)}
      title={t.label}
      aria-label={t.label}
    >
      <Icon className="size-4" />
    </span>
  );
}

export const ROLE_LABEL: Record<RoleValue, string> = {
  STUDENT: "Estudiante",
  INSTRUCTOR: "Docente",
  ADMIN: "Administrador",
};

export function RoleBadge({ role }: { role: RoleValue }) {
  const variant = role === "ADMIN" ? "accent" : role === "INSTRUCTOR" ? "blue" : "muted";
  return <Badge variant={variant}>{ROLE_LABEL[role]}</Badge>;
}

export const ENROLLMENT_STATUS: Record<"ACTIVE" | "COMPLETED" | "SUSPENDED", { label: string; variant: "blue" | "success" | "outline" }> = {
  ACTIVE: { label: "Activo", variant: "blue" },
  COMPLETED: { label: "Completado", variant: "success" },
  SUSPENDED: { label: "Suspendido", variant: "outline" },
};

export const RESOURCE_KIND_LABEL: Record<"PDF" | "LINK" | "FILE" | "AUDIO", string> = {
  PDF: "PDF",
  LINK: "Enlace",
  FILE: "Archivo",
  AUDIO: "Audio",
};

export const EVENT_KIND_LABEL: Record<"LIVE_CLASS" | "DEADLINE" | "SERVICE" | "OTHER", string> = {
  LIVE_CLASS: "Clase en vivo",
  DEADLINE: "Fecha límite",
  SERVICE: "Culto / servicio",
  OTHER: "Otro",
};

export const QUESTION_TYPE_LABEL: Record<
  "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY",
  { label: string; hint: string }
> = {
  SINGLE_CHOICE: { label: "Opción única", hint: "Una sola respuesta correcta" },
  MULTIPLE_CHOICE: { label: "Opción múltiple", hint: "Una o más respuestas correctas" },
  TRUE_FALSE: { label: "Verdadero o falso", hint: "Dos opciones fijas" },
  SHORT_ANSWER: { label: "Respuesta corta", hint: "Se compara con respuestas aceptadas" },
  ESSAY: { label: "Ensayo", hint: "Calificación manual del docente" },
};
