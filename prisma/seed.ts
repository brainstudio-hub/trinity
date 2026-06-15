import { PrismaClient, Role, Level } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@seminario.com" },
    update: {},
    create: {
      email: "admin@seminario.com",
      name: "Admin Trinity",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log({ admin });

  // 2. Create Instructors
  const instructor1 = await prisma.instructor.upsert({
    where: { id: "inst_1" },
    update: {},
    create: {
      id: "inst_1",
      name: "Dr. Alistair McGrath",
      department: "Teología Histórica",
      bio: "Reconocido teólogo y científico, autor de numerosos libros sobre la relación entre ciencia y fe.",
    }
  });

  const instructor2 = await prisma.instructor.upsert({
    where: { id: "inst_2" },
    update: {},
    create: {
      id: "inst_2",
      name: "Dr. Thomas Cranmer",
      department: "Liturgia y Reforma",
      bio: "Especialista en la Reforma Inglesa y la formación del Libro de Oración Común.",
    }
  });

  // 3. Create Sample Courses using Upsert with 'code'
  const course1 = await prisma.course.upsert({
    where: { code: "THEO-101" },
    update: {
      instructorId: instructor2.id,
      professorName: instructor2.name,
    },
    create: {
      code: "THEO-101",
      title: "Introducción a la Teología Anglicana",
      description: "Un recorrido por las bases históricas y doctrinales del anglicanismo.",
      category: "Teología",
      level: Level.BASICO,
      isPublished: true,
      instructorId: instructor2.id,
      professorName: instructor2.name,
      modules: {
        create: [
          {
            title: "Fundamentos",
            order: 1,
            lessons: {
              create: [
                { title: "Historia de la Reforma", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 1, isPublished: true },
                { title: "Los 39 Artículos", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 2, isPublished: true },
                { title: "Liturgia Anglicana", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 3, isPublished: true },
              ]
            }
          }
        ],
      },
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: "GRK-101" },
    update: {
      instructorId: instructor1.id,
      professorName: instructor1.name,
    },
    create: {
      code: "GRK-101",
      title: "Griego Bíblico I",
      description: "Aprende los fundamentos del griego koiné para el estudio del Nuevo Testamento.",
      category: "Idiomas Bíblicos",
      level: Level.INTERMEDIO,
      isPublished: true,
      instructorId: instructor1.id,
      professorName: instructor1.name,
      modules: {
        create: [
          {
            title: "Básico",
            order: 1,
            lessons: {
              create: [
                { title: "El Alfabeto", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 1, isPublished: true },
                { title: "Sustantivos de la 2da Declinación", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 2, isPublished: true },
                { title: "Verbos en Presente Activo", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 3, isPublished: true },
              ]
            }
          }
        ],
      },
    },
  });

  console.log("Seed data created successfully via upsert pattern.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
