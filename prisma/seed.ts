import { PrismaClient, Role, Level } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
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

  // 2. Create Sample Courses
  const course1 = await prisma.course.create({
    data: {
      title: "Introducción a la Teología Anglicana",
      description: "Un recorrido por las bases históricas y doctrinales del anglicanismo.",
      category: "Teología",
      level: Level.BASICO,
      isPublished: true,
      lessons: {
        create: [
          { title: "Historia de la Reforma", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 1, isPublished: true },
          { title: "Los 39 Artículos", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 2, isPublished: true },
          { title: "Liturgia Anglicana", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 3, isPublished: true },
        ],
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: "Griego Bíblico I",
      description: "Aprende los fundamentos del griego koiné para el estudio del Nuevo Testamento.",
      category: "Idiomas Bíblicos",
      level: Level.INTERMEDIO,
      isPublished: true,
      lessons: {
        create: [
          { title: "El Alfabeto", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 1, isPublished: true },
          { title: "Sustantivos de la 2da Declinación", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 2, isPublished: true },
          { title: "Verbos en Presente Activo", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 3, isPublished: true },
        ],
      },
    },
  });

  console.log("Seed data created successfully");
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
