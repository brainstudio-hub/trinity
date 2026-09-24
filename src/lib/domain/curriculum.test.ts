import { describe, expect, it } from "vitest";
import {
  moveLesson,
  planReorder,
  publishChecklist,
  uniqueSlug,
  validateQuestionDraft,
  validateReorder,
  type ModuleOrder,
} from "./curriculum";

const current: ModuleOrder[] = [
  { id: "m1", lessonIds: ["l1", "l2"] },
  { id: "m2", lessonIds: ["l3"] },
];

describe("validateReorder", () => {
  it("acepta un nuevo orden con los mismos elementos", () => {
    expect(
      validateReorder(current, [
        { id: "m2", lessonIds: ["l3", "l1"] },
        { id: "m1", lessonIds: ["l2"] },
      ])
    ).toBeNull();
  });

  it("rechaza módulos ajenos o faltantes", () => {
    expect(validateReorder(current, [{ id: "m1", lessonIds: ["l1", "l2", "l3"] }])).toMatch(/módulos/);
    expect(validateReorder(current, [...current, { id: "mx", lessonIds: [] }])).toMatch(/módulos/);
  });

  it("rechaza lecciones ajenas, faltantes o duplicadas", () => {
    expect(validateReorder(current, [{ id: "m1", lessonIds: ["l1", "l2", "lx"] }, { id: "m2", lessonIds: [] }])).toMatch(
      /lecciones/
    );
    expect(validateReorder(current, [{ id: "m1", lessonIds: ["l1"] }, { id: "m2", lessonIds: ["l3"] }])).toMatch(/lecciones/);
    expect(
      validateReorder(current, [{ id: "m1", lessonIds: ["l1", "l2"] }, { id: "m2", lessonIds: ["l3", "l1"] }])
    ).toMatch(/lecciones/);
  });
});

describe("planReorder", () => {
  it("asigna posiciones consecutivas y el módulo de cada lección", () => {
    const plan = planReorder([
      { id: "m2", lessonIds: ["l3", "l1"] },
      { id: "m1", lessonIds: ["l2"] },
    ]);
    expect(plan.modules).toEqual([
      { id: "m2", position: 0 },
      { id: "m1", position: 1 },
    ]);
    expect(plan.lessons).toEqual([
      { id: "l3", moduleId: "m2", position: 0 },
      { id: "l1", moduleId: "m2", position: 1 },
      { id: "l2", moduleId: "m1", position: 0 },
    ]);
  });
});

describe("moveLesson", () => {
  it("mueve una lección dentro del mismo módulo", () => {
    expect(moveLesson(current, "l2", "m1", 0)).toEqual([
      { id: "m1", lessonIds: ["l2", "l1"] },
      { id: "m2", lessonIds: ["l3"] },
    ]);
  });

  it("mueve una lección a otro módulo en la posición indicada", () => {
    expect(moveLesson(current, "l1", "m2", 1)).toEqual([
      { id: "m1", lessonIds: ["l2"] },
      { id: "m2", lessonIds: ["l3", "l1"] },
    ]);
  });

  it("permite mover a un módulo vacío y acota el índice", () => {
    const withEmpty = [...current, { id: "m3", lessonIds: [] }];
    expect(moveLesson(withEmpty, "l3", "m3", 99)[2]).toEqual({ id: "m3", lessonIds: ["l3"] });
  });

  it("no modifica nada si la lección o el módulo no existen", () => {
    expect(moveLesson(current, "zz", "m1", 0)).toEqual(current);
    expect(moveLesson(current, "l1", "zz", 0)).toEqual(current);
  });
});

describe("uniqueSlug", () => {
  it("devuelve la base si está libre", () => {
    expect(uniqueSlug("teologia", [])).toBe("teologia");
  });
  it("agrega un sufijo numérico si hay colisión", () => {
    expect(uniqueSlug("teologia", ["teologia", "teologia-2"])).toBe("teologia-3");
  });
  it("usa un valor por defecto si la base está vacía", () => {
    expect(uniqueSlug("", [])).toBe("curso");
  });
});

describe("publishChecklist", () => {
  const ready = {
    title: "Teología sistemática",
    description: "Un curso introductorio de teología sistemática.",
    coverImageUrl: "https://example.com/img.jpg",
    modules: [{ lessons: [{ isPublished: true }] }],
  };

  it("permite publicar un curso completo", () => {
    const c = publishChecklist(ready);
    expect(c.canPublish).toBe(true);
    expect(c.items.every((i) => i.ok)).toBe(true);
  });

  it("requiere al menos una lección publicada", () => {
    const c = publishChecklist({ ...ready, modules: [{ lessons: [{ isPublished: false }] }] });
    expect(c.canPublish).toBe(false);
    expect(c.items.find((i) => i.key === "lessons")?.ok).toBe(false);
  });

  it("la portada es recomendada pero no obligatoria", () => {
    const c = publishChecklist({ ...ready, coverImageUrl: null });
    expect(c.canPublish).toBe(true);
    expect(c.items.find((i) => i.key === "cover")).toMatchObject({ ok: false, required: false });
  });

  it("requiere descripción", () => {
    expect(publishChecklist({ ...ready, description: "  " }).canPublish).toBe(false);
  });
});

describe("validateQuestionDraft", () => {
  const base = { prompt: "¿Pregunta?", points: 1, acceptedAnswers: [] as string[] };

  it("exige enunciado y puntos positivos", () => {
    expect(validateQuestionDraft({ ...base, type: "ESSAY", prompt: " ", options: [] })).toMatch(/enunciado/);
    expect(validateQuestionDraft({ ...base, type: "ESSAY", points: 0, options: [] })).toMatch(/puntos/);
  });

  it("opción única necesita al menos 2 opciones y exactamente 1 correcta", () => {
    expect(validateQuestionDraft({ ...base, type: "SINGLE_CHOICE", options: [{ text: "A", isCorrect: true }] })).toMatch(
      /2 opciones/
    );
    expect(
      validateQuestionDraft({
        ...base,
        type: "SINGLE_CHOICE",
        options: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: true },
        ],
      })
    ).toMatch(/una sola/);
    expect(
      validateQuestionDraft({
        ...base,
        type: "SINGLE_CHOICE",
        options: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: false },
        ],
      })
    ).toBeNull();
  });

  it("opción múltiple necesita al menos 1 correcta y opciones con texto", () => {
    expect(
      validateQuestionDraft({
        ...base,
        type: "MULTIPLE_CHOICE",
        options: [
          { text: "A", isCorrect: false },
          { text: "B", isCorrect: false },
        ],
      })
    ).toMatch(/correcta/);
    expect(
      validateQuestionDraft({
        ...base,
        type: "MULTIPLE_CHOICE",
        options: [
          { text: "A", isCorrect: true },
          { text: " ", isCorrect: true },
        ],
      })
    ).toMatch(/texto/);
  });

  it("verdadero/falso necesita exactamente una respuesta correcta", () => {
    expect(
      validateQuestionDraft({
        ...base,
        type: "TRUE_FALSE",
        options: [
          { text: "Verdadero", isCorrect: false },
          { text: "Falso", isCorrect: false },
        ],
      })
    ).toMatch(/una sola/);
  });

  it("respuesta corta necesita al menos una respuesta aceptada", () => {
    expect(validateQuestionDraft({ ...base, type: "SHORT_ANSWER", options: [] })).toMatch(/respuesta aceptada/);
    expect(validateQuestionDraft({ ...base, type: "SHORT_ANSWER", options: [], acceptedAnswers: ["Nicea"] })).toBeNull();
  });
});
