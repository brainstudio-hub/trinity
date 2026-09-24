import { describe, expect, it } from "vitest";
import {
  computeCourseProgress,
  shouldAutoComplete,
  mergeWatchedSeconds,
  findResumeLesson,
} from "./progress";

const lessons = [
  { id: "l1", durationSeconds: 600 },
  { id: "l2", durationSeconds: 300 },
  { id: "l3", durationSeconds: 0 },
  { id: "l4", durationSeconds: 900 },
];

describe("computeCourseProgress", () => {
  it("es 0% sin progreso", () => {
    expect(computeCourseProgress(lessons, [])).toEqual({
      completed: 0,
      total: 4,
      percent: 0,
      isComplete: false,
    });
  });

  it("cuenta solo lecciones completadas y redondea", () => {
    const r = computeCourseProgress(lessons, [
      { lessonId: "l1", isCompleted: true },
      { lessonId: "l2", isCompleted: false },
    ]);
    expect(r.completed).toBe(1);
    expect(r.percent).toBe(25);
  });

  it("ignora progreso de lecciones que ya no pertenecen al curso", () => {
    const r = computeCourseProgress(lessons, [
      { lessonId: "l1", isCompleted: true },
      { lessonId: "borrada", isCompleted: true },
    ]);
    expect(r.completed).toBe(1);
  });

  it("marca 100% como completo", () => {
    const r = computeCourseProgress(
      lessons,
      lessons.map((l) => ({ lessonId: l.id, isCompleted: true }))
    );
    expect(r).toEqual({ completed: 4, total: 4, percent: 100, isComplete: true });
  });

  it("un curso sin lecciones no está completo", () => {
    expect(computeCourseProgress([], [])).toEqual({ completed: 0, total: 0, percent: 0, isComplete: false });
  });

  it("redondea hacia abajo para no mostrar 100% antes de tiempo", () => {
    const three = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const r = computeCourseProgress(three, [
      { lessonId: "a", isCompleted: true },
      { lessonId: "b", isCompleted: true },
    ]);
    expect(r.percent).toBe(66);
  });
});

describe("shouldAutoComplete", () => {
  it("completa al ver el 90% del video", () => {
    expect(shouldAutoComplete({ watchedSeconds: 540, durationSeconds: 600 })).toBe(true);
    expect(shouldAutoComplete({ watchedSeconds: 539, durationSeconds: 600 })).toBe(false);
  });
  it("no completa automáticamente si no se conoce la duración", () => {
    expect(shouldAutoComplete({ watchedSeconds: 5000, durationSeconds: 0 })).toBe(false);
  });
});

describe("mergeWatchedSeconds", () => {
  it("nunca supera la duración ni retrocede", () => {
    expect(mergeWatchedSeconds({ previous: 100, reported: 80, durationSeconds: 600 })).toBe(100);
    expect(mergeWatchedSeconds({ previous: 100, reported: 700, durationSeconds: 600 })).toBe(600);
    expect(mergeWatchedSeconds({ previous: 100, reported: 150, durationSeconds: 600 })).toBe(150);
  });
  it("sin duración conocida acepta el máximo reportado", () => {
    expect(mergeWatchedSeconds({ previous: 10, reported: 50, durationSeconds: 0 })).toBe(50);
  });
  it("descarta valores negativos o no numéricos", () => {
    expect(mergeWatchedSeconds({ previous: 10, reported: -5, durationSeconds: 100 })).toBe(10);
    expect(mergeWatchedSeconds({ previous: 10, reported: Number.NaN, durationSeconds: 100 })).toBe(10);
  });
});

describe("findResumeLesson", () => {
  const ordered = [{ id: "l1" }, { id: "l2" }, { id: "l3" }];

  it("retoma la última lección si no está completa", () => {
    expect(findResumeLesson(ordered, [{ lessonId: "l2", isCompleted: false }], "l2")).toBe("l2");
  });

  it("si la última está completa, va a la primera pendiente", () => {
    expect(
      findResumeLesson(
        ordered,
        [
          { lessonId: "l1", isCompleted: true },
          { lessonId: "l2", isCompleted: true },
        ],
        "l2"
      )
    ).toBe("l3");
  });

  it("sin historial, empieza por la primera", () => {
    expect(findResumeLesson(ordered, [], null)).toBe("l1");
  });

  it("con todo completo, vuelve a la primera", () => {
    expect(
      findResumeLesson(
        ordered,
        ordered.map((l) => ({ lessonId: l.id, isCompleted: true })),
        "l3"
      )
    ).toBe("l1");
  });

  it("devuelve null si no hay lecciones", () => {
    expect(findResumeLesson([], [], null)).toBeNull();
  });
});
