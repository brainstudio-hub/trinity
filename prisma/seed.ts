/**
 * Seed del campus Trinity.
 *
 *   npm run db:seed                 → crea categorías, usuarios base y el curso de Apocalipsis si no existe
 *   SEED_RESET_COURSE=1 npm run db:seed → vuelve a generar el contenido del curso (borra el existente)
 *   SEED_DEMO=1 npm run db:seed      → además crea un estudiante de demostración con progreso
 *
 * Credenciales iniciales: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (obligatoria en producción).
 */
import { PrismaClient, type LessonType, type QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import course from "./seed-data/apocalipsis.json";
import quizzes from "./seed-data/apocalipsis-quizzes.json";

const prisma = new PrismaClient();
const COST = 12;
const SLUG = "las-buenas-nuevas-del-apocalipsis";

const CATEGORIES = [
  { name: "Estudios Bíblicos", slug: "estudios-biblicos", description: "Antiguo y Nuevo Testamento" },
  { name: "Teología", slug: "teologia", description: "Teología sistemática y anglicana" },
  { name: "Historia de la Iglesia", slug: "historia-de-la-iglesia", description: "Patrística, Reforma y anglicanismo" },
  { name: "Liturgia y Espiritualidad", slug: "liturgia-y-espiritualidad", description: "Libro de Oración Común y vida devocional" },
  { name: "Práctica Pastoral", slug: "practica-pastoral", description: "Predicación, cuidado pastoral y misión" },
];

const MODULES: { title: string; description: string; sessions: number[] }[] = [
  {
    title: "Introducción al Apocalipsis",
    description: "Cómo leer el libro: enfoques de interpretación, literatura apocalíptica y la visión del Cristo exaltado.",
    sessions: [1, 2, 3],
  },
  {
    title: "Las cartas a las siete iglesias",
    description: "El mensaje de Cristo a su Iglesia a través del modelo de los pactos de vasallaje (Ap. 2-3).",
    sessions: [4, 5, 6],
  },
  {
    title: "El trono, el Cordero y los sellos",
    description: "La visión del cielo, el Cordero-León, el libro de los siete sellos y el primer interludio (Ap. 4-8).",
    sessions: [7, 8, 9],
  },
  {
    title: "Trompetas, conflicto y copas",
    description: "Las siete trompetas, la mujer y el dragón, las dos bestias y las siete copas (Ap. 8-16).",
    sessions: [10, 11, 12, 13],
  },
  {
    title: "La victoria de Dios",
    description: "La caída de Babilonia, la derrota de las bestias, el milenio y el juicio final (Ap. 17-20).",
    sessions: [14, 15, 16, 17],
  },
  {
    title: "Todo es renovado",
    description: "Cielo nuevo, tierra nueva y la nueva Jerusalén; epílogo del libro (Ap. 21-22).",
    sessions: [18],
  },
];

type SeedQuestion = {
  type: QuestionType;
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
};

function randomPassword() {
  return randomBytes(9).toString("base64url");
}

async function upsertUser(email: string, name: string, role: "ADMIN" | "INSTRUCTOR" | "STUDENT", password?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { user: existing, password: null as string | null };
  const pwd = password ?? randomPassword();
  const user = await prisma.user.create({
    data: { email, name, role, passwordHash: await bcrypt.hash(pwd, COST) },
  });
  return { user, password: pwd };
}

function questionCreate(q: SeedQuestion, position: number) {
  return {
    type: q.type,
    prompt: q.prompt,
    explanation: q.explanation ?? null,
    points: 1,
    position,
    options: { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) },
  };
}

function sessionContent(s: (typeof course.sessions)[number]) {
  const header = s.passage ? `> **Pasaje de estudio:** ${s.passage}\n\n` : "";
  return `${header}## Bosquejo de la sesión\n\n${s.outlineMarkdown}`;
}

function studyGuideQuestions(s: (typeof course.sessions)[number]): string[] {
  return s.studyGuide.flatMap((g) => g.questions);
}

function resourcesMarkdown() {
  return course.frontMatter.resources
    .map(
      (group) =>
        `### ${group.category}\n\n` +
        group.items.map((it) => `- ${it.citation}${it.note ? `\n  *${it.note}*` : ""}`).join("\n")
    )
    .join("\n\n");
}

async function seedCourse(createdById: string, categoryId: string) {
  const existing = await prisma.course.findUnique({ where: { slug: SLUG } });
  if (existing && process.env.SEED_RESET_COURSE !== "1") {
    console.log("• El curso de Apocalipsis ya existe (usa SEED_RESET_COURSE=1 para regenerarlo).");
    return existing;
  }
  if (existing) {
    await prisma.course.delete({ where: { id: existing.id } });
    console.log("• Curso existente eliminado para regenerar.");
  }

  const instructor =
    (await prisma.instructor.findFirst({ where: { name: "Rev. Dr. Rod Whitacre" } })) ??
    (await prisma.instructor.create({
      data: {
        name: "Rev. Dr. Rod Whitacre",
        title: "Seminario Anglicano Trinity",
        bio: "Autor de los esquemas de sesión y guías de trabajo de este curso.",
      },
    }));

  const created = await prisma.course.create({
    data: {
      slug: SLUG,
      code: "NT-APOC",
      title: course.course.title,
      subtitle: course.course.subtitle,
      description: course.course.description,
      level: "INTERMEDIO",
      status: "PUBLISHED",
      publishedAt: new Date(),
      learningOutcomes: course.course.learningOutcomes,
      requirements: [
        "Una Biblia de estudio (se recomienda la Reina-Valera o la Nueva Versión Internacional).",
        "Disposición para leer los pasajes de cada sesión antes de ver la clase.",
      ],
      estimatedHours: 36,
      passingScore: 70,
      categoryId,
      createdById,
      instructors: { create: [{ instructorId: instructor.id, position: 0 }] },
    },
  });

  // Módulo 0: orientación
  await prisma.module.create({
    data: {
      courseId: created.id,
      position: 0,
      title: "Antes de comenzar",
      description: "Orientación general, mapa del libro y bibliografía recomendada.",
      lessons: {
        create: [
          {
            position: 0,
            title: "Bienvenida al curso",
            type: "READING",
            isPublished: true,
            isFreePreview: true,
            durationSeconds: 300,
            content: `## Bienvenida\n\n${course.course.description}\n\n## Cómo está organizado\n\nEl curso tiene **18 sesiones** agrupadas en seis módulos. Cada sesión incluye:\n\n- **La clase en video** con el bosquejo de la sesión al lado, para seguirla con facilidad.\n- **Una guía de estudio** con preguntas de reflexión que entregas por escrito y revisa tu docente.\n\nAl final de cada módulo hay un **cuestionario** breve, y al terminar el curso, un **examen final**. Para obtener el certificado debes completar todas las lecciones y alcanzar un promedio mínimo de 70 en las evaluaciones.\n\n## Sugerencias\n\n- Lee el pasaje bíblico de la sesión antes de ver la clase.\n- Usa las **notas** del aula: cada nota guarda el minuto del video para que vuelvas a ese punto.\n- Si tienes una pregunta, publícala en la pestaña **Preguntas** de la lección.\n\n---\n\n*${course.course.copyright}*`,
          },
          {
            position: 1,
            title: "Mapa del libro de Apocalipsis",
            type: "READING",
            isPublished: true,
            isFreePreview: true,
            durationSeconds: 600,
            content: `## El libro de Apocalipsis sección por sección\n\n${course.frontMatter.sectionBySection}\n\n## Diagrama del libro\n\n${course.frontMatter.diagramNotes}`,
          },
          {
            position: 2,
            title: "Bibliografía recomendada",
            type: "READING",
            isPublished: true,
            durationSeconds: 300,
            content: `## Breve lista de recursos para estudiar el Apocalipsis\n\n${resourcesMarkdown()}`,
          },
        ],
      },
    },
  });

  const moduleQuizzes = quizzes.modules as { module: number; title: string; questions: SeedQuestion[] }[];

  for (const [mi, mod] of MODULES.entries()) {
    const m = await prisma.module.create({
      data: { courseId: created.id, position: mi + 1, title: mod.title, description: mod.description },
    });
    let position = 0;
    for (const n of mod.sessions) {
      const s = course.sessions.find((x) => x.number === n)!;
      await prisma.lesson.create({
        data: {
          moduleId: m.id,
          position: position++,
          title: `Sesión ${n}: ${s.title}`,
          summary: s.passage ? `Pasaje: ${s.passage}` : null,
          type: "VIDEO" satisfies LessonType,
          isPublished: true,
          content: sessionContent(s),
        },
      });
      await prisma.lesson.create({
        data: {
          moduleId: m.id,
          position: position++,
          title: `Guía de estudio ${n}`,
          summary: `Preguntas de reflexión sobre la sesión ${n}.`,
          type: "ASSIGNMENT",
          isPublished: true,
          content:
            "Responde cada pregunta con tus propias palabras (un párrafo por pregunta es suficiente). Tu docente revisará la entrega y te dejará comentarios.",
          quiz: {
            create: {
              instructions: "Escribe respuestas completas. Puedes consultar tus notas y el bosquejo de la sesión.",
              passingScore: 60,
              questions: {
                create: studyGuideQuestions(s).map((prompt, i) => ({
                  type: "ESSAY" as const,
                  prompt,
                  points: 2,
                  position: i,
                })),
              },
            },
          },
        },
      });
    }

    const mq = moduleQuizzes.find((q) => q.module === mi + 1);
    if (mq) {
      await prisma.lesson.create({
        data: {
          moduleId: m.id,
          position: position++,
          title: mq.title,
          type: "QUIZ",
          isPublished: true,
          durationSeconds: 600,
          content: "Cuestionario de repaso del módulo. Necesitas 70 % para aprobarlo; tienes hasta tres intentos.",
          quiz: {
            create: {
              passingScore: 70,
              maxAttempts: 3,
              shuffleQuestions: true,
              instructions: "Selecciona la respuesta correcta. En las preguntas de selección múltiple marca todas las que apliquen.",
              questions: { create: mq.questions.map(questionCreate) },
            },
          },
        },
      });
    }

    if (mi === MODULES.length - 1) {
      const fe = quizzes.finalExam as { title: string; questions: SeedQuestion[] };
      await prisma.lesson.create({
        data: {
          moduleId: m.id,
          position: position++,
          title: fe.title,
          type: "QUIZ",
          isPublished: true,
          durationSeconds: 45 * 60,
          content: "Evaluación integral del curso. Tienes 45 minutos y dos intentos.",
          quiz: {
            create: {
              passingScore: 70,
              maxAttempts: 2,
              timeLimitMinutes: 45,
              shuffleQuestions: true,
              instructions: "Lee con atención. El examen se envía automáticamente al terminar el tiempo.",
              questions: { create: fe.questions.map(questionCreate) },
            },
          },
        },
      });
    }
  }

  console.log(`• Curso creado: ${created.title}`);
  return created;
}

async function seedDemo(courseId: string) {
  const { user, password } = await upsertUser(
    process.env.SEED_STUDENT_EMAIL ?? "estudiante@trinity.test",
    "María Fernanda Ruiz",
    "STUDENT",
    process.env.SEED_STUDENT_PASSWORD
  );
  if (password) console.log(`• Estudiante demo: ${user.email}${process.env.SEED_STUDENT_PASSWORD ? "" : ` / ${password}`}`);

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    update: {},
    create: { userId: user.id, courseId, lastAccessedAt: new Date() },
  });

  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId }, isPublished: true },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, type: true },
    take: 5,
  });
  for (const l of lessons.slice(0, 4)) {
    if (l.type === "ASSIGNMENT" || l.type === "QUIZ") continue;
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: l.id } },
      update: {},
      create: { userId: user.id, lessonId: l.id, isCompleted: true, completedAt: new Date() },
    });
  }
  const next = lessons.find((l) => l.type === "VIDEO");
  if (next) {
    await prisma.enrollment.update({
      where: { userId_courseId: { userId: user.id, courseId } },
      data: { lastLessonId: next.id },
    });
  }

  const count = await prisma.event.count();
  if (count === 0) {
    const day = 24 * 60 * 60 * 1000;
    await prisma.event.createMany({
      data: [
        {
          title: "Clase en vivo: preguntas sobre las siete cartas",
          kind: "LIVE_CLASS",
          startsAt: new Date(Date.now() + 3 * day),
          endsAt: new Date(Date.now() + 3 * day + 60 * 60 * 1000),
          location: "Enlace de Zoom en el anuncio del curso",
          courseId,
        },
        {
          title: "Entrega: guías de estudio del módulo 1",
          kind: "DEADLINE",
          startsAt: new Date(Date.now() + 7 * day),
          courseId,
        },
      ],
    });
  }
}

async function main() {
  console.log("Sembrando datos del campus Trinity…");

  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, position: i } });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) throw new Error("Define SEED_ADMIN_EMAIL (y opcionalmente SEED_ADMIN_PASSWORD) para crear el administrador.");
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("En producción SEED_ADMIN_PASSWORD es obligatoria.");
  }
  const { user: admin, password } = await upsertUser(adminEmail, "Coordinación Académica", "ADMIN", process.env.SEED_ADMIN_PASSWORD);
  // Nunca registrar una contraseña que vino por variable de entorno (quedaría en los logs del servidor).
  const shown = password && !process.env.SEED_ADMIN_PASSWORD ? ` / ${password}` : "";
  console.log(password ? `• Administrador creado: ${admin.email}${shown}` : `• Administrador existente: ${admin.email}`);

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "estudios-biblicos" } });
  const created = await seedCourse(admin.id, category.id);

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        title: "Bienvenidos al nuevo campus virtual",
        body: "Estrenamos plataforma: ahora puedes tomar notas sincronizadas con cada clase, presentar tus guías de estudio en línea y descargar tu certificado al terminar.",
      },
    });
  }

  if (process.env.SEED_DEMO === "1") await seedDemo(created.id);
  console.log("Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
