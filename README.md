# Campus Trinity

Campus virtual del **Seminario Anglicano Trinity** (programa hispano): cursos en video, bosquejos de clase, notas sincronizadas con el video, guías de estudio calificadas por el docente, cuestionarios, foro por lección y certificados verificables.

## Funcionalidades

**Estudiantes**
- Catálogo con búsqueda y filtros por área y nivel; página de curso con temario, docentes, material y reseñas.
- Aula inmersiva: reproductor de YouTube que **guarda la posición** y marca la lección como vista al 90 %, bosquejo de la clase al lado, recursos, preguntas y respuestas.
- **Notas con marca de tiempo**: cada nota guarda el minuto del video; un clic vuelve a ese momento. Vista global en *Mis notas* con búsqueda.
- Evaluaciones: cuestionarios autocalificados (selección única o múltiple, verdadero/falso, respuesta corta), tiempo límite, intentos máximos y revisión con retroalimentación; **tareas** con respuestas abiertas que califica el docente.
- Panel de inicio con “continuar donde lo dejaste”, progreso, eventos y anuncios; calendario; perfil.
- **Certificados** con código público de verificación (`/certificados/TAS-XXXX-XXXX`), listos para imprimir o guardar en PDF.

**Equipo docente (`/admin`)**
- Creador de cursos: información, currículo con arrastrar y soltar (módulos y lecciones), editor de lecciones (video por enlace de YouTube / Google Drive / Vimeo con vista previa, contenido en Markdown, recursos) y constructor de cuestionarios.
- Cola de calificación de tareas, gestión de estudiantes e inscripciones, usuarios y roles, docentes, categorías, anuncios y eventos.

**Roles**: `STUDENT`, `INSTRUCTOR` (gestiona solo sus cursos) y `ADMIN`.

## Tecnología

- Next.js 14 (App Router, Server Components y Server Actions) · TypeScript
- PostgreSQL + Prisma (el esquema se aplica con `prisma db push`, sin carpeta de migraciones)
- Auth.js v5: credenciales con bcrypt (costo 12), sesión JWT en cookie HttpOnly, límite de intentos y recuperación de contraseña por enlace de un solo uso
- Tailwind CSS con la identidad del Seminario (EB Garamond + Montserrat; paleta de tas.edu)
- Vitest para la lógica de negocio (`src/lib/domain`)

## Desarrollo local

```bash
npm install
npm run db:push      # aplica prisma/schema.prisma a la base de DATABASE_URL
npm run db:seed      # categorías, administrador y el curso de Apocalipsis
npm run dev
npm test             # pruebas de dominio
```

Variables de entorno (`.env`, nunca se versiona):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres. En local se usa la base del entorno **development** de Railway. |
| `AUTH_SECRET` | Firma de la sesión (distinta por entorno). |
| `AUTH_TRUST_HOST` | `true` detrás del proxy de Railway. |
| `APP_URL` | URL pública, para los enlaces de los correos. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Opcional. Envío de correos (recuperación de contraseña). Sin clave, el enlace se registra en la consola del servidor. |
| `ALLOW_REGISTRATION` | `false` para cerrar el registro abierto (solo invitación). |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Administrador que crea el seed. |

Opciones del seed: `SEED_RESET_COURSE=1` regenera el curso de Apocalipsis; `SEED_DEMO=1` crea un estudiante de demostración con progreso.

## Contenido del primer curso

`prisma/seed-data/apocalipsis.json` contiene las 18 sesiones de *Las Buenas Nuevas del Apocalipsis* (Rev. Dr. Rod Whitacre) —bosquejos y guías de estudio— y `apocalipsis-quizzes.json` los cuestionarios por módulo y el examen final (borrador para revisión docente). Los videos se enlazan desde el editor de lecciones; se recomienda YouTube en modo **no listado**, porque es el proveedor que permite sincronizar las notas con el minuto del video (Google Drive no expone la posición de reproducción).

## Despliegue (Railway)

El servicio `LMS` del proyecto *Seminario Anglicano Trinity* despliega automáticamente la rama `main`. El entorno `development` tiene su propia base de datos para pruebas. Antes del primer despliegue de esta versión hay que aplicar el esquema a la base de producción (`prisma db push`) y ejecutar el seed con `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
