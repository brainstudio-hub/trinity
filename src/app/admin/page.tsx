import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, GraduationCap, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, Progress, Stat } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { CourseStatusBadge } from "@/components/admin/labels";
import { getAdminOverview, requireStaff } from "@/lib/queries/admin";
import { formatRelative, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Resumen" };

export default async function AdminOverviewPage() {
  const user = await requireStaff();
  const { stats, recentEnrollments, pending, completion } = await getAdminOverview(user);
  const firstName = user.name.split(" ")[0];
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <AdminBreadcrumbs items={[{ label: "Resumen" }]} />
      <PageHeader
        eyebrow="Panel de administración"
        title={`Hola, ${firstName}`}
        description={
          isAdmin
            ? "Una mirada rápida a la vida académica del campus."
            : "Una mirada rápida a tus cursos y estudiantes."
        }
        actions={
          <Button asChild>
            <Link href="/admin/cursos/nuevo">
              <Plus /> Nuevo curso
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={isAdmin ? "Estudiantes activos" : "Estudiantes"} value={stats.students} icon={<Users />} />
        <Stat label="Inscripciones activas" value={stats.activeEnrollments} icon={<UserPlus />} />
        <Stat label="Cursos publicados" value={stats.publishedCourses} icon={<BookOpen />} />
        <Stat
          label="Por calificar"
          value={stats.pendingCount}
          icon={<ClipboardCheck />}
          hint={stats.pendingCount > 0 ? "Entregas esperando revisión" : "Todo al día"}
          className={stats.pendingCount > 0 ? "ring-1 ring-tas-gold/50" : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Entregas pendientes</CardTitle>
              <CardDescription>Tareas y ensayos que esperan tu calificación, del más antiguo al más reciente.</CardDescription>
            </div>
            {pending.length > 0 && (
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/admin/calificaciones">
                  Ver todas <ArrowRight />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck />}
                title="Sin entregas pendientes"
                description="Cuando un estudiante envíe una tarea o un ensayo, aparecerá aquí."
                className="py-10"
              />
            ) : (
              <ul className="-mx-2 divide-y">
                {pending.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/calificaciones/${a.id}`}
                      className="flex items-center gap-3 rounded-md px-2 py-3 transition hover:bg-secondary/60"
                    >
                      <Avatar name={a.user.name} src={a.user.avatarUrl} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{a.quiz.lesson.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.user.name} · {a.quiz.lesson.module.course.title}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {a.submittedAt ? formatRelative(a.submittedAt) : "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inscripciones recientes</CardTitle>
            <CardDescription>Últimos estudiantes que se unieron a un curso.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEnrollments.length === 0 ? (
              <EmptyState icon={<UserPlus />} title="Aún no hay inscripciones" className="py-10" />
            ) : (
              <ul className="space-y-4">
                {recentEnrollments.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <Avatar name={e.user.name} src={e.user.avatarUrl} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.user.name}</p>
                      <Link
                        href={`/admin/cursos/${e.course.id}/estudiantes`}
                        className="block truncate text-xs text-muted-foreground hover:text-tas-blue hover:underline"
                      >
                        {e.course.title}
                      </Link>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Avance por curso</CardTitle>
            <CardDescription>Progreso promedio de los estudiantes y porcentaje que ya terminó el curso.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/admin/cursos">
              Cursos <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {completion.length === 0 ? (
            <EmptyState
              icon={<GraduationCap />}
              title="Todavía no hay cursos"
              description="Crea tu primer curso para empezar a ver estadísticas."
              action={
                <Button asChild>
                  <Link href="/admin/cursos/nuevo">
                    <Plus /> Crear curso
                  </Link>
                </Button>
              }
              className="py-10"
            />
          ) : (
            <ul className="divide-y">
              {completion.map((c) => (
                <li key={c.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_220px] sm:items-center sm:gap-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/cursos/${c.id}`} className="truncate text-sm font-semibold text-tas-navy hover:underline">
                        {c.title}
                      </Link>
                      <CourseStatusBadge status={c.status} className="shrink-0" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pluralize(c.enrolled, "estudiante")} · {c.completed} {c.completed === 1 ? "completó" : "completaron"} (
                      {c.completionRate}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={c.averageProgress} label={`Progreso promedio de ${c.title}`} className="h-2" />
                    <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-tas-navy">
                      {c.averageProgress}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
