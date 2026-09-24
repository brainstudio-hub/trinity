import { ClipboardCheck, FileText, PenLine, PlayCircle } from "lucide-react";
import type { LessonType } from "@prisma/client";
import { cn } from "@/lib/utils";

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  VIDEO: "Video",
  READING: "Lectura",
  QUIZ: "Cuestionario",
  ASSIGNMENT: "Tarea",
};

export function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const Icon = { VIDEO: PlayCircle, READING: FileText, QUIZ: ClipboardCheck, ASSIGNMENT: PenLine }[type];
  return <Icon className={cn("size-4", className)} aria-label={LESSON_TYPE_LABEL[type]} />;
}
