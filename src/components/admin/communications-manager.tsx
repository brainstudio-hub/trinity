"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ExternalLink, MapPin, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Dialog, DialogContent, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import {
  deleteAnnouncementAction,
  deleteEventAction,
  saveAnnouncementAction,
  saveEventAction,
} from "@/lib/actions/admin/communications";
import { cn } from "@/lib/utils";
import { ConfirmDialog, MarkdownEditor, useAdminAction } from "./admin-kit";
import { EVENT_KIND_LABEL } from "./labels";

type EventKind = keyof typeof EVENT_KIND_LABEL;
type CourseOption = { id: string; title: string };
type Announcement = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  courseId: string | null;
  courseTitle: string | null;
  isPublished: boolean;
  publishedAt: string;
};
type EventItem = {
  id: string;
  title: string;
  description: string | null;
  kind: EventKind;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  courseId: string | null;
  courseTitle: string | null;
};

const dateTimeFmt = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });

/** ISO → valor para <input type="datetime-local"> en la zona horaria del navegador. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : "");

export function CommunicationsManager({
  announcements,
  events,
  courses,
  defaultTab,
}: {
  announcements: Announcement[];
  events: EventItem[];
  courses: CourseOption[];
  defaultTab: "anuncios" | "eventos";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = React.useState(defaultTab);
  const [editingA, setEditingA] = React.useState<Announcement | "new" | null>(null);
  const [editingE, setEditingE] = React.useState<EventItem | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<{ kind: "a" | "e"; id: string; title: string } | null>(null);
  const [pending, run] = useAdminAction();
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now).reverse();
  const past = events.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() < now);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as typeof tab);
        router.replace(v === "eventos" ? `${pathname}?tab=eventos` : pathname, { scroll: false });
      }}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TabsList className="flex-1">
          <TabsTrigger value="anuncios">
            <Megaphone /> Anuncios <span className="text-xs font-normal text-muted-foreground">{announcements.length}</span>
          </TabsTrigger>
          <TabsTrigger value="eventos">
            <CalendarDays /> Eventos <span className="text-xs font-normal text-muted-foreground">{upcoming.length} próximos</span>
          </TabsTrigger>
        </TabsList>
        <Button onClick={() => (tab === "anuncios" ? setEditingA("new") : setEditingE("new"))} className="sm:mb-3">
          <Plus /> {tab === "anuncios" ? "Nuevo anuncio" : "Nuevo evento"}
        </Button>
      </div>

      <TabsContent value="anuncios">
        {announcements.length === 0 ? (
          <EmptyState icon={<Megaphone />} title="Sin anuncios" description="Publica avisos para toda la comunidad o para un curso específico." />
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border bg-card p-4 shadow-soft sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant={a.isPublished ? "success" : "muted"}>{a.isPublished ? "Publicado" : "Borrador"}</Badge>
                      <Badge variant={a.courseTitle ? "blue" : "outline"} className="max-w-full normal-case tracking-normal">
                        <span className="truncate">{a.courseTitle ?? "General"}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {dateFmt.format(new Date(a.publishedAt))}
                      </span>
                    </div>
                    <p className="font-semibold text-tas-navy">{a.title}</p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tas-blue hover:underline">
                        Ver enlace <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditingA(a)} aria-label={`Editar ${a.title}`}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting({ kind: "a", id: a.id, title: a.title })}
                      aria-label={`Eliminar ${a.title}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="eventos">
        {events.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="Sin eventos" description="Agenda clases en vivo, fechas de entrega o cultos de la comunidad." />
        ) : (
          <div className="space-y-8">
            <EventList title="Próximos" items={upcoming} onEdit={setEditingE} onDelete={(e) => setDeleting({ kind: "e", id: e.id, title: e.title })} />
            {past.length > 0 && (
              <EventList title="Pasados" items={past} muted onEdit={setEditingE} onDelete={(e) => setDeleting({ kind: "e", id: e.id, title: e.title })} />
            )}
          </div>
        )}
      </TabsContent>

      <AnnouncementDialog item={editingA} courses={courses} onClose={() => setEditingA(null)} />
      <EventDialog item={editingE} courses={courses} onClose={() => setEditingE(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting?.kind === "a" ? "¿Eliminar anuncio?" : "¿Eliminar evento?"}
        description={deleting ? `«${deleting.title}» se eliminará para todos.` : undefined}
        pending={pending}
        onConfirm={() =>
          deleting &&
          run(() => (deleting.kind === "a" ? deleteAnnouncementAction(deleting.id) : deleteEventAction(deleting.id)), {
            success: deleting.kind === "a" ? "Anuncio eliminado." : "Evento eliminado.",
            onSuccess: () => setDeleting(null),
          })
        }
      />
    </Tabs>
  );
}

function EventList({
  title,
  items,
  muted,
  onEdit,
  onDelete,
}: {
  title: string;
  items: EventItem[];
  muted?: boolean;
  onEdit: (e: EventItem) => void;
  onDelete: (e: EventItem) => void;
}) {
  return (
    <section>
      <h3 className="eyebrow mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No hay eventos próximos.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
          {items.map((e) => {
            const start = new Date(e.startsAt);
            return (
              <li key={e.id} className={cn("flex items-start gap-4 px-4 py-3.5 sm:px-5", muted && "opacity-70")}>
                <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-surface py-1.5 text-center" suppressHydrationWarning>
                  <span className="text-2xs font-semibold uppercase text-tas-crimson" suppressHydrationWarning>
                    {new Intl.DateTimeFormat("es", { month: "short" }).format(start)}
                  </span>
                  <span className="font-serif text-xl leading-none text-tas-navy" suppressHydrationWarning>
                    {start.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={e.kind === "LIVE_CLASS" ? "blue" : e.kind === "DEADLINE" ? "accent" : e.kind === "SERVICE" ? "gold" : "muted"}>
                      {EVENT_KIND_LABEL[e.kind]}
                    </Badge>
                    {e.courseTitle && <span className="truncate text-xs text-muted-foreground">{e.courseTitle}</span>}
                  </div>
                  <p className="font-semibold text-tas-navy">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
                    {dateTimeFmt.format(start)}
                    {e.endsAt && ` – ${timeFmt.format(new Date(e.endsAt))}`}
                  </p>
                  {e.location && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" /> <span className="truncate">{e.location}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(e)} aria-label={`Editar ${e.title}`}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(e)}
                    aria-label={`Eliminar ${e.title}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CourseSelect({ id, value, onChange, courses }: { id: string; value: string; onChange: (v: string) => void; courses: CourseOption[] }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">General (toda la comunidad)</option>
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </Select>
  );
}

function AnnouncementDialog({ item, courses, onClose }: { item: Announcement | "new" | null; courses: CourseOption[]; onClose: () => void }) {
  const empty = { title: "", body: "", link: "", courseId: "", isPublished: true };
  const [v, setV] = React.useState(empty);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();

  React.useEffect(() => {
    setError(null);
    if (item && item !== "new") {
      setV({ title: item.title, body: item.body, link: item.link ?? "", courseId: item.courseId ?? "", isPublished: item.isPublished });
    } else if (item === "new") setV({ title: "", body: "", link: "", courseId: "", isPublished: true });
  }, [item]);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setError(null);
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item === "new" ? "Nuevo anuncio" : "Editar anuncio"} size="lg">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveAnnouncementAction(item && item !== "new" ? item.id : null, v), {
              success: v.isPublished ? "Anuncio publicado." : "Anuncio guardado como borrador.",
              onSuccess: onClose,
              onError: setError,
            });
          }}
        >
          <Field label="Título" htmlFor="an-title">
            <Input id="an-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={160} autoFocus />
          </Field>
          <Field label="Mensaje" htmlFor="an-body">
            <MarkdownEditor id="an-body" value={v.body} onChange={(val) => set("body", val)} rows={6} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Enlace" htmlFor="an-link" optional>
              <Input id="an-link" type="url" value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Audiencia" htmlFor="an-course">
              <CourseSelect id="an-course" value={v.courseId} onChange={(val) => set("courseId", val)} courses={courses} />
            </Field>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
            <span>
              <span className="block text-sm font-semibold">Publicado</span>
              <span className="block text-xs text-muted-foreground">Visible en el inicio de los estudiantes.</span>
            </span>
            <Switch checked={v.isPublished} onCheckedChange={(c) => set("isPublished", c)} aria-label="Publicado" />
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!v.title.trim() || !v.body.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EventDialog({ item, courses, onClose }: { item: EventItem | "new" | null; courses: CourseOption[]; onClose: () => void }) {
  const [v, setV] = React.useState({ title: "", description: "", kind: "LIVE_CLASS" as EventKind, startsAt: "", endsAt: "", location: "", courseId: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();

  React.useEffect(() => {
    setError(null);
    if (item && item !== "new") {
      setV({
        title: item.title,
        description: item.description ?? "",
        kind: item.kind,
        startsAt: toLocalInput(item.startsAt),
        endsAt: toLocalInput(item.endsAt),
        location: item.location ?? "",
        courseId: item.courseId ?? "",
      });
    } else if (item === "new") {
      setV({ title: "", description: "", kind: "LIVE_CLASS", startsAt: "", endsAt: "", location: "", courseId: "" });
    }
  }, [item]);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setError(null);
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item === "new" ? "Nuevo evento" : "Editar evento"} size="lg">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                saveEventAction(item && item !== "new" ? item.id : null, {
                  ...v,
                  startsAt: fromLocalInput(v.startsAt),
                  endsAt: fromLocalInput(v.endsAt),
                }),
              { success: "Evento guardado.", onSuccess: onClose, onError: setError }
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field label="Título" htmlFor="ev-title">
              <Input id="ev-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={160} autoFocus />
            </Field>
            <Field label="Tipo" htmlFor="ev-kind">
              <Select id="ev-kind" value={v.kind} onChange={(e) => set("kind", e.target.value as EventKind)}>
                {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((k) => (
                  <option key={k} value={k}>
                    {EVENT_KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inicio" htmlFor="ev-start">
              <Input id="ev-start" type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Término" htmlFor="ev-end" optional>
              <Input id="ev-end" type="datetime-local" value={v.endsAt} min={v.startsAt || undefined} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lugar o enlace" htmlFor="ev-loc" optional hint="Dirección física o enlace de Zoom / Meet.">
              <Input id="ev-loc" value={v.location} onChange={(e) => set("location", e.target.value)} maxLength={500} />
            </Field>
            <Field label="Curso" htmlFor="ev-course">
              <CourseSelect id="ev-course" value={v.courseId} onChange={(val) => set("courseId", val)} courses={courses} />
            </Field>
          </div>
          <Field label="Descripción" htmlFor="ev-desc" optional>
            <Textarea id="ev-desc" value={v.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={5000} />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!v.title.trim() || !v.startsAt}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
