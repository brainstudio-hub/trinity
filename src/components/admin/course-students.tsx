"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, PauseCircle, PlayCircle, Search, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Avatar, Badge, EmptyState, Progress } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { enrollByEmailAction, removeEnrollmentAction, setEnrollmentStatusAction } from "@/lib/actions/admin/enrollments";
import { formatRelative, formatShortDate, pluralize } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";
import { ENROLLMENT_STATUS } from "./labels";

type Row = {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED";
  createdAt: string;
  lastAccessedAt: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  progress: { completed: number; total: number; percent: number };
};

export function CourseStudents({ courseId, rows, canViewUsers }: { courseId: string; rows: Row[]; canViewUsers: boolean }) {
  const [query, setQuery] = React.useState("");
  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<Row | null>(null);
  const [pending, run] = useAdminAction();

  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q)) : rows;
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.progress.percent, 0) / rows.length) : 0;
  const completed = rows.filter((r) => r.status === "COMPLETED").length;

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Inscritos", value: rows.length },
          { label: "Progreso promedio", value: `${avg}%` },
          { label: "Completaron", value: completed },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-serif text-2xl text-tas-navy">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar estudiante…"
            aria-label="Buscar estudiante"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setEnrollOpen(true)}>
          <UserPlus /> Inscribir estudiante
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Nadie inscrito todavía"
          description="Los estudiantes se inscriben desde la página del curso cuando está publicado. También puedes inscribirlos tú por correo."
          action={
            <Button variant="outline" onClick={() => setEnrollOpen(true)}>
              <UserPlus /> Inscribir estudiante
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search />} title="Sin resultados" description={`Ningún estudiante coincide con «${query}».`} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="hidden grid-cols-[1fr_200px_130px_110px_40px] gap-4 border-b bg-secondary/40 px-5 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Estudiante</span>
            <span>Progreso</span>
            <span>Último acceso</span>
            <span>Estado</span>
            <span className="sr-only">Acciones</span>
          </div>
          <ul className="divide-y">
            {filtered.map((r) => {
              const st = ENROLLMENT_STATUS[r.status];
              return (
                <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 md:grid-cols-[1fr_200px_130px_110px_40px] md:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.user.name} src={r.user.avatarUrl} size={36} />
                    <div className="min-w-0">
                      {canViewUsers ? (
                        <Link href={`/admin/usuarios/${r.user.id}`} className="block truncate text-sm font-semibold hover:text-tas-blue hover:underline">
                          {r.user.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold">{r.user.name}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">{r.user.email}</p>
                    </div>
                  </div>
                  <div className="order-last col-span-2 flex items-center gap-3 md:order-none md:col-span-1">
                    <Progress value={r.progress.percent} label={`Progreso de ${r.user.name}`} tone={r.progress.percent === 100 ? "success" : "navy"} />
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.progress.percent}%</span> · {r.progress.completed}/{r.progress.total}
                    </span>
                  </div>
                  <p className="hidden text-xs text-muted-foreground md:block" suppressHydrationWarning>
                    {r.lastAccessedAt ? formatRelative(r.lastAccessedAt) : "Nunca"}
                    <span className="block text-2xs" suppressHydrationWarning>Desde {formatShortDate(r.createdAt)}</span>
                  </p>
                  <div className="hidden md:block">
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${r.user.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {r.status === "SUSPENDED" ? (
                        <DropdownMenuItem
                          onSelect={() => run(() => setEnrollmentStatusAction(r.id, "ACTIVE"), { success: "Inscripción reactivada." })}
                        >
                          <PlayCircle /> Reactivar acceso
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={() => run(() => setEnrollmentStatusAction(r.id, "SUSPENDED"), { success: "Acceso suspendido." })}
                        >
                          <PauseCircle /> Suspender acceso
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setRemoving(r)}>
                        <Trash2 /> Quitar del curso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
          <p className="border-t bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
            {pluralize(filtered.length, "estudiante")}
            {q && ` de ${rows.length}`}
          </p>
        </div>
      )}

      <EnrollDialog courseId={courseId} open={enrollOpen} onOpenChange={setEnrollOpen} />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="¿Quitar del curso?"
        description={
          removing
            ? `${removing.user.name} perderá el acceso al curso. Su progreso y notas se conservan si vuelve a inscribirse.`
            : undefined
        }
        confirmLabel="Quitar inscripción"
        pending={pending}
        onConfirm={() =>
          removing &&
          run(() => removeEnrollmentAction(removing.id), { success: "Inscripción eliminada.", onSuccess: () => setRemoving(null) })
        }
      />
    </div>
  );
}

function EnrollDialog({ courseId, open, onOpenChange }: { courseId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Inscribir estudiante" description="Ingresa el correo de una cuenta existente del campus." size="sm">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(() => enrollByEmailAction(courseId, email), {
              success: (r) => `${r.name} quedó inscrito.`,
              onSuccess: () => onOpenChange(false),
              onError: setError,
            });
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="enroll-email" className="text-[0.8125rem] font-semibold">
              Correo electrónico
            </label>
            <Input
              id="enroll-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="nombre@correo.com"
              autoFocus
              aria-invalid={!!error}
            />
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!email.trim()}>
              Inscribir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
