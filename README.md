# Trinity LMS

Plataforma de gestión de aprendizaje para el **Seminario Anglicano Trinity**.

## Características
- Autenticación segura con NextAuth.js.
- Roles de usuario (USER, ADMIN).
- Gestión de cursos y lecciones (Panel Admin).
- Reproductor de video integrado para YouTube y Vimeo.
- Sistema de inscripción gratuita.
- Seguimiento de progreso por lección.

## Tecnologías
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS & shadcn/ui
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Autenticación:** NextAuth.js (Auth.js v5)

## Configuración

1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en un archivo `.env` (ver `.env.example`).
4. Sincronizar base de datos: `npx prisma db push`
5. Poblar datos iniciales: `npx prisma db seed`
6. Iniciar servidor de desarrollo: `npm run dev`

## Datos de prueba (Seed)
- **Admin:** admin@seminario.com / admin123
- **Cursos:** Introducción a la Teología, Griego Bíblico.

## Licencia
MIT
