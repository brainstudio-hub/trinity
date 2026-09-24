"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, FileAudio, FileText, GripVertical, Link2, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/primitives";
import { addResourceAction, deleteResourceAction, reorderResourcesAction, updateResourceAction } from "@/lib/actions/admin/resources";
import { cn } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";
import { RESOURCE_KIND_LABEL } from "./labels";

type Kind = "PDF" | "LINK" | "FILE" | "AUDIO";
export type ResourceItem = { id: string; title: string; url: string; kind: Kind };
type Scope = { courseId: string } | { lessonId: string };

const KIND_ICON: Record<Kind, React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  LINK: Link2,
  FILE: Paperclip,
  AUDIO: FileAudio,
};

function guessKind(url: string): Kind {
  const u = url.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(u)) return "PDF";
  if (/\.(mp3|m4a|wav|ogg)(\?|#|$)/.test(u)) return "AUDIO";
  if (/\.(docx?|pptx?|xlsx?|zip|epub)(\?|#|$)/.test(u)) return "FILE";
  return "LINK";
}

export function ResourcesEditor({ scope, initial, emptyHint }: { scope: Scope; initial: ResourceItem[]; emptyHint?: string }) {
  const [items, setItems] = React.useState(initial);
  const [editing, setEditing] = React.useState<ResourceItem | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<ResourceItem | null>(null);
  const [pending, run] = useAdminAction();
  const [, runReorder] = useAdminAction();

  const key = JSON.stringify(initial);
  React.useEffect(() => setItems(JSON.parse(key) as ResourceItem[]), [key]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(items, items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
    setItems(next);
    runReorder(() => reorderResourcesAction(scope, next.map((i) => i.id)), { onError: () => setItems(before) });
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState
          icon={<Paperclip />}
          title="Sin recursos"
          description={emptyHint ?? "Agrega lecturas en PDF, enlaces o audios complementarios."}
          className="py-10"
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {items.map((item) => (
                <ResourceRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <Button type="button" variant="outline" onClick={() => setEditing("new")}>
        <Plus /> Agregar recurso
      </Button>

      <ResourceDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(values, done) => {
          const target = editing;
          if (!target) return;
          run(() => (target === "new" ? addResourceAction(scope, values) : updateResourceAction(target.id, values)), {
            success: target === "new" ? "Recurso agregado." : "Recurso actualizado.",
            onSuccess: () => {
              setEditing(null);
              done();
            },
            onError: done,
          });
        }}
        pending={pending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar recurso?"
        description={deleting ? `«${deleting.title}» dejará de estar disponible para los estudiantes.` : undefined}
        pending={pending}
        onConfirm={() =>
          deleting &&
          run(() => deleteResourceAction(deleting.id), { success: "Recurso eliminado.", onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

function ResourceRow({ item, onEdit, onDelete }: { item: ResourceItem; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const Icon = KIND_ICON[item.kind];
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-center gap-3 bg-card px-2 py-2.5 sm:px-3", isDragging && "relative z-10 opacity-60 shadow-lift")}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
        aria-label={`Mover ${item.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-tas-navy">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-1 truncate text-xs text-muted-foreground hover:text-tas-blue"
        >
          <span className="truncate">{item.url}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </div>
      <span className="hidden text-2xs font-semibold uppercase tracking-wider text-muted-foreground sm:block">
        {RESOURCE_KIND_LABEL[item.kind]}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Editar ${item.title}`}>
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`Eliminar ${item.title}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function ResourceDialog({
  item,
  onClose,
  onSave,
  pending,
}: {
  item: ResourceItem | "new" | null;
  onClose: () => void;
  onSave: (values: { title: string; url: string; kind: Kind }, done: () => void) => void;
  pending: boolean;
}) {
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [kind, setKind] = React.useState<Kind>("LINK");
  const [kindTouched, setKindTouched] = React.useState(false);

  React.useEffect(() => {
    if (item && item !== "new") {
      setTitle(item.title);
      setUrl(item.url);
      setKind(item.kind);
      setKindTouched(true);
    } else if (item === "new") {
      setTitle("");
      setUrl("");
      setKind("LINK");
      setKindTouched(false);
    }
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item === "new" ? "Agregar recurso" : "Editar recurso"} size="md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ title, url, kind }, () => undefined);
          }}
        >
          <Field label="Título" htmlFor="res-title">
            <Input id="res-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus required />
          </Field>
          <Field label="Enlace" htmlFor="res-url" hint="Enlace público de Google Drive, Dropbox, un sitio web, etc.">
            <Input
              id="res-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (!kindTouched) setKind(guessKind(e.target.value));
              }}
              placeholder="https://…"
              required
            />
          </Field>
          <Field label="Tipo" htmlFor="res-kind">
            <Select
              id="res-kind"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setKindTouched(true);
              }}
            >
              {(Object.keys(RESOURCE_KIND_LABEL) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {RESOURCE_KIND_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!title.trim() || !url.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
