import type { QuestionType } from "./quiz";

// ── Orden del currículo ────────────────────────────────────────
export type ModuleOrder = { id: string; lessonIds: string[] };

/** Verifica que el nuevo orden contenga exactamente los mismos módulos y lecciones del curso. */
export function validateReorder(current: ModuleOrder[], next: ModuleOrder[]): string | null {
  const currentModules = new Set(current.map((m) => m.id));
  const nextModules = next.map((m) => m.id);
  if (
    nextModules.length !== currentModules.size ||
    new Set(nextModules).size !== nextModules.length ||
    nextModules.some((id) => !currentModules.has(id))
  ) {
    return "El orden enviado no coincide con los módulos del curso. Recarga la página e intenta de nuevo.";
  }

  const currentLessons = new Set(current.flatMap((m) => m.lessonIds));
  const nextLessons = next.flatMap((m) => m.lessonIds);
  if (
    nextLessons.length !== currentLessons.size ||
    new Set(nextLessons).size !== nextLessons.length ||
    nextLessons.some((id) => !currentLessons.has(id))
  ) {
    return "El orden enviado no coincide con las lecciones del curso. Recarga la página e intenta de nuevo.";
  }
  return null;
}

export function planReorder(next: ModuleOrder[]) {
  return {
    modules: next.map((m, position) => ({ id: m.id, position })),
    lessons: next.flatMap((m) => m.lessonIds.map((id, position) => ({ id, moduleId: m.id, position }))),
  };
}

/** Mueve una lección (dentro del mismo módulo o hacia otro) sin mutar el estado original. */
export function moveLesson(state: ModuleOrder[], lessonId: string, toModuleId: string, toIndex: number): ModuleOrder[] {
  const from = state.find((m) => m.lessonIds.includes(lessonId));
  const to = state.find((m) => m.id === toModuleId);
  if (!from || !to) return state;

  const without = state.map((m) => (m.id === from.id ? { ...m, lessonIds: m.lessonIds.filter((id) => id !== lessonId) } : m));
  return without.map((m) => {
    if (m.id !== toModuleId) return m;
    const ids = [...m.lessonIds];
    const index = Math.max(0, Math.min(toIndex, ids.length));
    ids.splice(index, 0, lessonId);
    return { ...m, lessonIds: ids };
  });
}

// ── Slugs ──────────────────────────────────────────────────────
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const root = base || "curso";
  const set = new Set(taken);
  if (!set.has(root)) return root;
  let n = 2;
  while (set.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

// ── Lista previa a la publicación ──────────────────────────────
export type ChecklistItem = { key: string; label: string; ok: boolean; required: boolean };

export function publishChecklist(course: {
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  modules: { lessons: { isPublished: boolean }[] }[];
}): { items: ChecklistItem[]; canPublish: boolean } {
  const items: ChecklistItem[] = [
    { key: "title", label: "El curso tiene título", ok: course.title.trim().length > 0, required: true },
    {
      key: "description",
      label: "El curso tiene una descripción",
      ok: (course.description ?? "").trim().length > 0,
      required: true,
    },
    {
      key: "lessons",
      label: "Al menos un módulo con una lección publicada",
      ok: course.modules.some((m) => m.lessons.some((l) => l.isPublished)),
      required: true,
    },
    {
      key: "cover",
      label: "Imagen de portada (recomendado)",
      ok: !!course.coverImageUrl?.trim(),
      required: false,
    },
  ];
  return { items, canPublish: items.every((i) => i.ok || !i.required) };
}

// ── Preguntas ──────────────────────────────────────────────────
export type QuestionDraft = {
  type: QuestionType;
  prompt: string;
  points: number;
  options: { text: string; isCorrect: boolean }[];
  acceptedAnswers: string[];
};

export function validateQuestionDraft(q: QuestionDraft): string | null {
  if (!q.prompt.trim()) return "Escribe el enunciado de la pregunta.";
  if (!Number.isInteger(q.points) || q.points < 1) return "Asigna puntos a la pregunta (mínimo 1).";

  if (q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
    if (q.options.length < 2) return "Agrega al menos 2 opciones.";
    if (q.options.some((o) => !o.text.trim())) return "Todas las opciones deben tener texto.";
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (q.type !== "MULTIPLE_CHOICE" && correct !== 1) return "Marca una sola opción correcta.";
    if (correct === 0) return "Marca al menos una opción correcta.";
  }
  if (q.type === "SHORT_ANSWER" && !q.acceptedAnswers.some((a) => a.trim())) {
    return "Agrega al menos una respuesta aceptada.";
  }
  return null;
}
