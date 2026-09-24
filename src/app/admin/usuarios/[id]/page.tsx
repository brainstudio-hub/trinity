import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BookOpen, ClipboardCheck } from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Progress } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { ENROLLMENT_STATUS, RoleBadge } from "@/components/admin/labels";
import { UserDetailActions } from "@/components/admin/users-admin";
import { getUserDetail, requireAdmin } from "@/lib/queries/admin";
import { cn, formatDate, formatRelative, formatShortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle de usuario" };

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const me = await requireAdmin();
  const user = await getUserDetail(params.id);
  if (!user) notFound();

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: "Usuarios", href: "/admin/usuarios" }, { label: user.name }]} />
      <Link
        href="/admin/usuarios"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Todos los usuarios
      </Link>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user.name} src={user.avatarUrl} size={72} className={user.isActive ? undefined : "opacity-60"} />
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            {!user.isActive && <Badge variant="outline">Suspendido</Badge>}
            {user.instructorProfile && <Badge variant="gold">Perfil docente</Badge>}
          </div>
          <h1 className="display text-3xl">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email}
            {user.headline && ` · ${user.headline}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursos inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              {user.enrollments.length === 0 ? (
                <EmptyState icon={<BookOpen />} title="Sin inscripciones" className="py-8" />
              ) : (
                <ul className="divide-y">
                  {user.enrollments.map((e) => {
                    const st = ENROLLMENT_STATUS[e.status];
                    return (
                      <li key={e.id} className="grid gap-2 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_200px] sm:items-center sm:gap-6">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/cursos/${e.course.id}/estudiantes`} className="truncate text-sm font-semibold hover:text-tas-blue hover:underline">
                              {e.course.title}
                            </Link>
                            <Badge variant={st.variant} className="shrink-0">
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Inscrito el {formatShortDate(e.createdAt)} · Último acceso{" "}
                            {e.lastAccessedAt ? formatRelative(e.lastAccessedAt) : "nunca"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={e.progress.percent} tone={e.progress.isComplete ? "success" : "navy"} label={`Progreso en ${e.course.title}`} />
                          <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums">{e.progress.percent}%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluaciones recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {user.quizAttempts.length === 0 ? (
                <EmptyState icon={<ClipboardCheck />} title="Sin evaluaciones entregadas" className="py-8" />
              ) : (
                <ul className="divide-y">
                  {user.quizAttempts.map((a) => (
                    <li key={a.id}>
                      <Link href={`/admin/calificaciones/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-secondary/50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.quiz.lesson.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.quiz.lesson.module.course.title}
                            {a.submittedAt && ` · ${formatShortDate(a.submittedAt)}`}
                          </p>
                        </div>
                        {a.status === "SUBMITTED" ? (
                          <Badge variant="gold">Por calificar</Badge>
                        ) : (
                          <span className={cn("text-sm font-semibold tabular-nums", a.passed ? "text-success" : "text-tas-crimson-dark")}>
                            {a.score ?? "—"}%
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="eyebrow mb-4">Acceso</p>
            <UserDetailActions user={{ id: user.id, name: user.name, role: user.role, isActive: user.isActive }} isMe={me.id === user.id} />
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-3">Actividad</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Cuenta creada</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Último ingreso</dt>
                <dd>{user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Nunca"}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-3">Certificados</p>
            {user.certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no tiene certificados.</p>
            ) : (
              <ul className="space-y-3">
                {user.certificates.map((c) => (
                  <li key={c.id} className="flex gap-2.5 text-sm">
                    <Award className="mt-0.5 size-4 shrink-0 text-tas-gold" />
                    <div className="min-w-0">
                      <p className="font-medium">{c.course.title}</p>
                      <p className="font-mono text-2xs text-muted-foreground">
                        {c.code} · {formatShortDate(c.issuedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
