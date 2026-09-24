"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  GripVertical,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Switch,
  Tooltip,
} from "@/components/ui/overlay";
import {
  createLessonAction,
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  publishModuleAction,
  reorderCurriculumAction,
  setLessonFlagsAction,
  updateModuleAction,
} from "@/lib/actions/admin/curriculum";
import { moveLesson, type ModuleOrder } from "@/lib/domain/curriculum";
import { formatDuration, formatTimestamp } from "@/lib/domain/format";
import { cn, pluralize } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";
import { LESSON_TYPES, LessonTypeIcon, type LessonTypeValue } from "./labels";

export type CurriculumLesson = {
  id: string;
  title: string;
  type: LessonTypeValue;
  durationSeconds: number;
  isPublished: boolean;
  isFreePreview: boolean;
  hasVideo: boolean;
  questionCount: number | null;
};
export type CurriculumModuleData = { id: string; title: string; description: string | null; lessons: CurriculumLesson[] };

const MOD = "module:";
const LES = "lesson:";
const DROP = "drop:";
const strip = (id: string | number) => String(id).replace(/^(module|lesson|drop):/, "");

function toOrder(modules: CurriculumModuleData[]): ModuleOrder[] {
  return modules.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) }));
}
function fromOrder(order: ModuleOrder[], modules: CurriculumModuleData[]): CurriculumModuleData[] {
  const lessons = new Map(modules.flatMap((m) => m.lessons).map((l) => [l.id, l]));
  const mods = new Map(modules.map((m) => [m.id, m]));
  return order.map((o) => ({ ...mods.get(o.id)!, lessons: o.lessonIds.map((id) => lessons.get(id)!) }));
}
const signature = (modules: CurriculumModuleData[]) => JSON.stringify(toOrder(modules));

// Colisiones: los módulos solo compiten con módulos; las lecciones con lecciones y zonas de módulo.
const collisionDetection: CollisionDetection = (args) => {
  if (args.active.data.current?.type === "module") {
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "module") });
  }
  const containers = args.droppableContainers.filter((c) => c.data.current?.type !== "module");
  const hits = pointerWithin({ ...args, droppableContainers: containers });
  if (hits.length) {
    const lessonHits = new Set(hits.filter((h) => String(h.id).startsWith(LES)).map((h) => h.id));
    if (lessonHits.size) return closestCenter({ ...args, droppableContainers: containers.filter((c) => lessonHits.has(c.id)) });
    return hits;
  }
  return closestCorners({ ...args, droppableContainers: containers });
};

const screenReaderInstructions = {
  draggable:
    "Para mover un elemento, presiona espacio o Enter. Usa las flechas para cambiar su posición y presiona espacio o Enter de nuevo para soltarlo, o Escape para cancelar.",
};

export function CurriculumEditor({ courseId, initialModules }: { courseId: string; initialModules: CurriculumModuleData[] }) {
  const router = useRouter();
  const [modules, setModules] = React.useState(initialModules);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [saving, runReorder] = useAdminAction();
  const snapshot = React.useRef<CurriculumModuleData[] | null>(null);
  const [addLessonTo, setAddLessonTo] = React.useState<string | null>(null);

  // Sincronizar con el servidor cuando cambian los datos (tras guardar o crear).
  const serverKey = JSON.stringify(initialModules);
  React.useEffect(() => {
    setModules(JSON.parse(serverKey) as CurriculumModuleData[]);
  }, [serverKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const lessonCount = modules.reduce((a, m) => a + m.lessons.length, 0);
  const publishedCount = modules.reduce((a, m) => a + m.lessons.filter((l) => l.isPublished).length, 0);
  const totalSeconds = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.durationSeconds, 0), 0);

  const moduleOfLesson = (lessonId: string, list = modules) => list.find((m) => m.lessons.some((l) => l.id === lessonId));

  const onDragStart = (e: DragStartEvent) => {
    snapshot.current = modules;
    setActiveId(String(e.active.id));
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== "lesson") return;
    const lessonId = strip(active.id);
    const overId = String(over.id);
    setModules((prev) => {
      const from = moduleOfLesson(lessonId, prev);
      let toModuleId: string | undefined;
      let toIndex = 0;
      if (overId.startsWith(LES)) {
        const target = moduleOfLesson(strip(overId), prev);
        if (!target) return prev;
        toModuleId = target.id;
        const overIndex = target.lessons.findIndex((l) => l.id === strip(overId));
        const translated = active.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        toIndex = overIndex + (below ? 1 : 0);
      } else if (overId.startsWith(DROP)) {
        toModuleId = strip(overId);
        toIndex = prev.find((m) => m.id === toModuleId)?.lessons.length ?? 0;
      }
      if (!from || !toModuleId || from.id === toModuleId) return prev;
      return fromOrder(moveLesson(toOrder(prev), lessonId, toModuleId, toIndex), prev);
    });
    if (overId.startsWith(DROP)) {
      const id = strip(overId);
      setCollapsed((c) => (c.has(id) ? new Set(Array.from(c).filter((x) => x !== id)) : c));
    }
  };

  const persist = (next: CurriculumModuleData[]) => {
    const before = snapshot.current;
    if (!before || signature(before) === signature(next)) return;
    runReorder(() => reorderCurriculumAction(courseId, toOrder(next)), {
      onError: () => setModules(before),
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    let next = modules;
    if (over) {
      if (active.data.current?.type === "module") {
        const from = modules.findIndex((m) => m.id === strip(active.id));
        const to = modules.findIndex((m) => m.id === strip(over.id));
        if (from >= 0 && to >= 0 && from !== to) next = arrayMove(modules, from, to);
      } else if (String(over.id).startsWith(LES)) {
        const mod = moduleOfLesson(strip(active.id));
        if (mod && mod.lessons.some((l) => l.id === strip(over.id))) {
          const from = mod.lessons.findIndex((l) => l.id === strip(active.id));
          const to = mod.lessons.findIndex((l) => l.id === strip(over.id));
          if (from !== to) {
            next = modules.map((m) => (m.id === mod.id ? { ...m, lessons: arrayMove(m.lessons, from, to) } : m));
          }
        }
      }
    }
    setModules(next);
    persist(next);
    snapshot.current = null;
  };

  const onDragCancel = () => {
    setActiveId(null);
    if (snapshot.current) setModules(snapshot.current);
    snapshot.current = null;
  };

  const activeModule = activeId?.startsWith(MOD) ? modules.find((m) => m.id === strip(activeId)) : null;
  const activeLesson = activeId?.startsWith(LES) ? modules.flatMap((m) => m.lessons).find((l) => l.id === strip(activeId)) : null;

  const toggle = (id: string) =>
    setCollapsed((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const allCollapsed = modules.length > 0 && collapsed.size >= modules.length;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {pluralize(modules.length, "módulo")} · {pluralize(lessonCount, "lección", "lecciones")} ({publishedCount}{" "}
            {publishedCount === 1 ? "publicada" : "publicadas"}) · {formatDuration(totalSeconds)}
          </span>
          {saving && (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3.5 animate-spin" /> Guardando orden…
            </span>
          )}
        </div>
        {modules.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(modules.map((m) => m.id)))}
          >
            {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
            {allCollapsed ? "Expandir todo" : "Contraer todo"}
          </Button>
        )}
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={<LayoutList />}
          title="Arma el currículo"
          description="Organiza el curso en módulos (unidades o semanas) y agrega lecciones de video, lectura, cuestionarios o tareas."
          className="mb-6"
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          accessibility={{ screenReaderInstructions }}
        >
          <SortableContext items={modules.map((m) => MOD + m.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-4">
              {modules.map((m, index) => (
                <SortableModule
                  key={m.id}
                  courseId={courseId}
                  module={m}
                  index={index}
                  collapsed={collapsed.has(m.id) || !!activeModule}
                  onToggle={() => toggle(m.id)}
                  onAddLesson={() => setAddLessonTo(m.id)}
                  onLessonChange={(lessonId, patch) =>
                    setModules((prev) =>
                      prev.map((mm) => ({ ...mm, lessons: mm.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) }))
                    )
                  }
                />
              ))}
            </ol>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
            {activeModule ? (
              <div className="rounded-lg border bg-card px-4 py-3 shadow-lift">
                <p className="eyebrow">Módulo</p>
                <p className="font-semibold text-tas-navy">{activeModule.title}</p>
              </div>
            ) : activeLesson ? (
              <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 shadow-lift">
                <GripVertical className="size-4 text-muted-foreground" />
                <LessonTypeIcon type={activeLesson.type} />
                <span className="truncate text-sm font-medium">{activeLesson.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <NewModuleForm courseId={courseId} isFirst={modules.length === 0} />

      <AddLessonDialog
        moduleId={addLessonTo}
        moduleTitle={modules.find((m) => m.id === addLessonTo)?.title ?? ""}
        onClose={() => setAddLessonTo(null)}
        onCreated={(lessonId, openEditor) => {
          if (openEditor) router.push(`/admin/cursos/${courseId}/lecciones/${lessonId}`);
        }}
        courseId={courseId}
      />
    </div>
  );
}

// ── Módulo ─────────────────────────────────────────────────────
function SortableModule({
  courseId,
  module: m,
  index,
  collapsed,
  onToggle,
  onAddLesson,
  onLessonChange,
}: {
  courseId: string;
  module: CurriculumModuleData;
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onLessonChange: (lessonId: string, patch: Partial<CurriculumLesson>) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: MOD + m.id,
    data: { type: "module" },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: DROP + m.id, data: { type: "drop", moduleId: m.id } });
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(m.title);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, run] = useAdminAction();
  const bodyId = `module-body-${m.id}`;

  React.useEffect(() => setTitle(m.title), [m.title]);

  const published = m.lessons.filter((l) => l.isPublished).length;
  const seconds = m.lessons.reduce((a, l) => a + l.durationSeconds, 0);

  const saveTitle = () => {
    const t = title.trim();
    if (!t || t === m.title) {
      setTitle(m.title);
      setEditing(false);
      return;
    }
    run(() => updateModuleAction(m.id, { title: t, description: m.description }), {
      success: "Módulo renombrado.",
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("list-none", isDragging && "opacity-40")}
    >
      <div
        ref={setDropRef}
        className={cn(
          "overflow-hidden rounded-lg border bg-card shadow-soft transition-shadow",
          isOver && "ring-2 ring-tas-blue/30"
        )}
      >
        <div className="flex items-center gap-2 border-b bg-secondary/35 px-2 py-2.5 sm:px-3">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground active:cursor-grabbing"
            aria-label={`Mover módulo ${m.title}`}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label={collapsed ? "Expandir módulo" : "Contraer módulo"}
          >
            <ChevronDown className={cn("size-4 transition-transform", collapsed && "-rotate-90")} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Módulo {index + 1}</p>
            {editing ? (
              <form
                className="mt-0.5 flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveTitle();
                }}
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setTitle(m.title);
                      setEditing(false);
                    }
                  }}
                  autoFocus
                  maxLength={160}
                  className="h-8"
                  aria-label="Nombre del módulo"
                />
                <Button type="submit" size="icon-sm" loading={pending} aria-label="Guardar nombre">
                  {!pending && <Check />}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setTitle(m.title);
                    setEditing(false);
                  }}
                  aria-label="Cancelar"
                >
                  <X />
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onDoubleClick={() => setEditing(true)}
                onClick={onToggle}
                className="block max-w-full truncate text-left text-[0.9375rem] font-semibold text-tas-navy"
                title="Doble clic para renombrar"
              >
                {m.title}
              </button>
            )}
          </div>

          {!editing && (
            <span className="hidden shrink-0 text-xs text-muted-foreground md:block">
              {published}/{m.lessons.length} publicadas{seconds > 0 && ` · ${formatDuration(seconds)}`}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Acciones del módulo ${m.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil /> Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddLesson}>
                <Plus /> Agregar lección
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={m.lessons.length === 0 || published === m.lessons.length}
                onSelect={() =>
                  run(() => publishModuleAction(m.id, true), {
                    success: (r) => (r.count ? `${pluralize(r.count, "lección publicada", "lecciones publicadas")}.` : "No había lecciones por publicar."),
                  })
                }
              >
                <Eye /> Publicar todo el módulo
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={published === 0}
                onSelect={() =>
                  run(() => publishModuleAction(m.id, false), {
                    success: (r) => `${pluralize(r.count, "lección pasó", "lecciones pasaron")} a borrador.`,
                  })
                }
              >
                <EyeOff /> Pasar todo a borrador
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Eliminar módulo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!collapsed && (
          <div id={bodyId}>
            <SortableContext items={m.lessons.map((l) => LES + l.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y">
                {m.lessons.map((l, li) => (
                  <SortableLesson
                    key={l.id}
                    courseId={courseId}
                    lesson={l}
                    number={`${index + 1}.${li + 1}`}
                    onChange={(patch) => onLessonChange(l.id, patch)}
                  />
                ))}
              </ul>
            </SortableContext>
            {m.lessons.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                Este módulo aún no tiene lecciones. Arrastra una aquí o crea una nueva.
              </p>
            )}
            <div className="border-t border-dashed px-3 py-2">
              <Button variant="ghost" size="sm" onClick={onAddLesson} className="text-tas-blue hover:text-tas-blue">
                <Plus /> Agregar lección
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar este módulo?"
        description={
          m.lessons.length
            ? `Se eliminarán también sus ${pluralize(m.lessons.length, "lección", "lecciones")}, con el progreso, notas y entregas de los estudiantes. Esta acción no se puede deshacer.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar módulo"
        pending={pending}
        onConfirm={() =>
          run(() => deleteModuleAction(m.id), { success: "Módulo eliminado.", onSuccess: () => setConfirmDelete(false) })
        }
      />
    </li>
  );
}

// ── Lección ────────────────────────────────────────────────────
function SortableLesson({
  courseId,
  lesson: l,
  number,
  onChange,
}: {
  courseId: string;
  lesson: CurriculumLesson;
  number: string;
  onChange: (patch: Partial<CurriculumLesson>) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: LES + l.id,
    data: { type: "lesson" },
  });
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, run] = useAdminAction();
  const [togglePending, runToggle] = useAdminAction();
  const href = `/admin/cursos/${courseId}/lecciones/${l.id}`;

  const meta: string[] = [LESSON_TYPES[l.type].label];
  if (l.durationSeconds > 0) meta.push(formatTimestamp(l.durationSeconds));
  if (l.questionCount !== null && (l.type === "QUIZ" || l.type === "ASSIGNMENT")) meta.push(pluralize(l.questionCount, "pregunta"));
  const warning = l.type === "VIDEO" && !l.hasVideo ? "Sin video" : (l.type === "QUIZ" || l.type === "ASSIGNMENT") && !l.questionCount ? "Sin preguntas" : null;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group relative flex items-center gap-2 bg-card px-2 py-2.5 sm:gap-3 sm:px-3", isDragging && "z-10 opacity-40")}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 transition hover:bg-secondary hover:text-foreground active:cursor-grabbing"
        aria-label={`Mover lección ${l.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <LessonTypeIcon type={l.type} className="hidden sm:inline-flex" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{number}</span>
          <Link href={href} className="truncate text-sm font-medium text-foreground hover:text-tas-blue hover:underline">
            {l.title}
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{meta.join(" · ")}</span>
          {warning && <span className="font-medium text-tas-crimson-dark">· {warning}</span>}
          {l.isFreePreview && <Badge variant="gold">Vista previa gratis</Badge>}
          <Badge variant={l.isPublished ? "success" : "muted"} className="sm:hidden">
            {l.isPublished ? "Publicada" : "Borrador"}
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <span className={cn("hidden w-[72px] text-right text-xs font-medium sm:block", l.isPublished ? "text-success" : "text-muted-foreground")}>
          {l.isPublished ? "Publicada" : "Borrador"}
        </span>
        <Tooltip content={l.isPublished ? "Pasar a borrador" : "Publicar lección"}>
          <span className="inline-flex">
            <Switch
              checked={l.isPublished}
              disabled={togglePending}
              aria-label={l.isPublished ? `Pasar a borrador ${l.title}` : `Publicar ${l.title}`}
              onCheckedChange={(v) => {
                onChange({ isPublished: v });
                runToggle(() => setLessonFlagsAction(l.id, { isPublished: v }), {
                  success: v ? "Lección publicada." : "Lección en borrador.",
                  onError: () => onChange({ isPublished: !v }),
                });
              }}
            />
          </span>
        </Tooltip>
        <Button asChild variant="ghost" size="icon-sm" aria-label={`Editar ${l.title}`}>
          <Link href={href}>
            <Pencil />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmDelete(true)}
          aria-label={`Eliminar ${l.title}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar esta lección?"
        description={`"${l.title}" se eliminará junto con el progreso, notas, comentarios y entregas de los estudiantes. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar lección"
        pending={pending}
        onConfirm={() =>
          run(() => deleteLessonAction(l.id), { success: "Lección eliminada.", onSuccess: () => setConfirmDelete(false) })
        }
      />
    </li>
  );
}

// ── Nuevo módulo ───────────────────────────────────────────────
function NewModuleForm({ courseId, isFirst }: { courseId: string; isFirst: boolean }) {
  const [title, setTitle] = React.useState("");
  const [pending, run] = useAdminAction();
  return (
    <form
      className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed bg-surface/60 p-3 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        run(() => createModuleAction(courseId, { title }), { success: "Módulo creado.", onSuccess: () => setTitle("") });
      }}
    >
      <label htmlFor="new-module" className="sr-only">
        Nombre del nuevo módulo
      </label>
      <Input
        id="new-module"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isFirst ? "Nombre del primer módulo, p. ej. «Semana 1: Introducción»" : "Nombre del nuevo módulo"}
        maxLength={160}
        className="bg-surface"
      />
      <Button type="submit" variant={isFirst ? "default" : "outline"} loading={pending} disabled={!title.trim()} className="shrink-0">
        <Plus /> Agregar módulo
      </Button>
    </form>
  );
}

// ── Nueva lección ──────────────────────────────────────────────
function AddLessonDialog({
  courseId,
  moduleId,
  moduleTitle,
  onClose,
  onCreated,
}: {
  courseId: string;
  moduleId: string | null;
  moduleTitle: string;
  onClose: () => void;
  onCreated: (lessonId: string, openEditor: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<LessonTypeValue>("VIDEO");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();

  React.useEffect(() => {
    if (moduleId) {
      setTitle("");
      setType("VIDEO");
      setError(null);
    }
  }, [moduleId]);

  const submit = (edit: boolean) => {
    if (!moduleId) return;
    if (!title.trim()) {
      setError("Escribe el título de la lección.");
      return;
    }
    run(() => createLessonAction(moduleId, { title, type }), {
      onSuccess: (r) => {
        if (edit) {
          onClose();
        } else {
          // Seguir creando en el mismo módulo sin cerrar el diálogo.
          setTitle("");
          toast.success(`«${title.trim()}» creada como borrador.`, {
            action: { label: "Editar", onClick: () => router.push(`/admin/cursos/${courseId}/lecciones/${r.id}`) },
          });
        }
        onCreated(r.id, edit);
      },
      onError: setError,
    });
  };

  return (
    <Dialog open={!!moduleId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Nueva lección" description={moduleTitle ? `En «${moduleTitle}»` : undefined} size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(true);
          }}
          className="space-y-5"
          noValidate
        >
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-semibold">Tipo de lección</legend>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(LESSON_TYPES) as LessonTypeValue[]).map((t) => {
                const info = LESSON_TYPES[t];
                const selected = type === t;
                return (
                  <label
                    key={t}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-ring",
                      selected ? "border-tas-navy bg-tas-navy/[0.03] ring-1 ring-tas-navy" : "hover:border-tas-taupe/50 hover:bg-secondary/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="lesson-type"
                      value={t}
                      checked={selected}
                      onChange={() => setType(t)}
                      className="sr-only"
                    />
                    <LessonTypeIcon type={t} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{info.label}</span>
                      <span className="block text-xs leading-snug text-muted-foreground">{info.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Field label="Título" htmlFor="lesson-title" error={error}>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Por ejemplo: La visión del trono (Ap 4–5)"
              maxLength={200}
              autoFocus
              aria-invalid={!!error}
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={() => submit(false)} disabled={pending}>
              Crear y seguir
            </Button>
            <Button type="submit" loading={pending}>
              Crear y editar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
