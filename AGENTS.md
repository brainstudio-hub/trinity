# Reglas e Instrucciones para el Desarrollo (LMS Trinity)

## 1. Stack Tecnológico y Base de Datos
- **Base de Datos:** Usar exclusivamente PostgreSQL en entornos de desarrollo y producción (Railway). Está **ESTRICTAMENTE PROHIBIDO** cambiar o degradar el entorno a SQLite.
- **ORM (Prisma):** No se utilizarán archivos de migración locales (carpeta `prisma/migrations`). Las actualizaciones de esquema se aplican directamente mediante `npx prisma db push`.
- **Framework:** Next.js 14+ utilizando de forma estricta el **App Router**. Los componentes deben ser React Server Components (RSC) por defecto, a menos que requieran interactividad en el cliente (`"use client"`).

## 2. Autenticación y Seguridad
- **Manejo de Sesiones:** JWT manejado única y exclusivamente a través de **HttpOnly Cookies** en las mutaciones de servidor para mitigar vulnerabilidades XSS.
- **Criptografía:** Todas las contraseñas de los usuarios deben encriptarse siempre utilizando **Bcrypt** con un factor de costo mínimo de 10 antes de persistirse en PostgreSQL.

## 3. Flujo de Trabajo y Calidad de Código
- **TDD Estricto:** Se debe aplicar Desarrollo Guiado por Pruebas (TDD) utilizando Jest / Vitest para toda la lógica de negocio, cálculos de progreso y consultas complejas antes de escribir cualquier UI.
- **Validación Obligatoria:** Está **PROHIBIDO** dar por terminada una tarea o realizar un Pull Request (PR) sin proveer una captura de pantalla o video demostrativo del funcionamiento real en el navegador.
- **Manejo de Errores:** Toda operación asíncrona, Server Action o consulta a base de datos debe estar envuelta en bloques `try/catch` estructurados que retornen errores amigables al usuario final.
