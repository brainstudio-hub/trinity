export type LessonRef = { id: string; durationSeconds?: number };
export type ProgressRef = { lessonId: string; isCompleted: boolean };

export type CourseProgress = {
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
};

/** Umbral de visualización a partir del cual una lección de video se marca como vista. */
export const AUTO_COMPLETE_RATIO = 0.9;

export function computeCourseProgress(lessons: LessonRef[], progress: ProgressRef[]): CourseProgress {
  const total = lessons.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0, isComplete: false };

  const ids = new Set(lessons.map((l) => l.id));
  const completed = new Set(
    progress.filter((p) => p.isCompleted && ids.has(p.lessonId)).map((p) => p.lessonId)
  ).size;

  // Hacia abajo: 99,9 % no debe mostrarse como 100 %.
  const percent = Math.floor((completed / total) * 100);
  return { completed, total, percent, isComplete: completed === total };
}

export function shouldAutoComplete({
  watchedSeconds,
  durationSeconds,
}: {
  watchedSeconds: number;
  durationSeconds: number;
}): boolean {
  if (durationSeconds <= 0) return false;
  return watchedSeconds >= durationSeconds * AUTO_COMPLETE_RATIO;
}

/** El avance visto solo crece y nunca supera la duración del video. */
export function mergeWatchedSeconds({
  previous,
  reported,
  durationSeconds,
}: {
  previous: number;
  reported: number;
  durationSeconds: number;
}): number {
  if (!Number.isFinite(reported) || reported < 0) return previous;
  const next = Math.max(previous, Math.floor(reported));
  return durationSeconds > 0 ? Math.min(next, durationSeconds) : next;
}

/** Lección donde el estudiante debería continuar. */
export function findResumeLesson(
  orderedLessons: { id: string }[],
  progress: ProgressRef[],
  lastLessonId: string | null
): string | null {
  if (orderedLessons.length === 0) return null;
  const done = new Set(progress.filter((p) => p.isCompleted).map((p) => p.lessonId));

  if (lastLessonId && orderedLessons.some((l) => l.id === lastLessonId) && !done.has(lastLessonId)) {
    return lastLessonId;
  }
  const pending = orderedLessons.find((l) => !done.has(l.id));
  return (pending ?? orderedLessons[0]).id;
}
