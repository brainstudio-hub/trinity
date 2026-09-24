"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { deleteCategoryAction, reorderCategoriesAction, saveCategoryAction } from "@/lib/actions/admin/catalog";
import { cn, pluralize } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";

type Category = { id: string; name: string; slug: string; description: string | null; courseCount: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [items, setItems] = React.useState(categories);
  const [editing, setEditing] = React.useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const [pending, run] = useAdminAction();
  const [, runReorder] = useAdminAction();

  const key = JSON.stringify(categories);
  React.useEffect(() => setItems(JSON.parse(key) as Category[]), [key]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(items, items.findIndex((c) => c.id === active.id), items.findIndex((c) => c.id === over.id));
    setItems(next);
    runReorder(() => reorderCategoriesAction(next.map((c) => c.id)), { success: "Orden actualizado.", onError: () => setItems(before) });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> Nueva categoría
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Tags />} title="Sin categorías" description="Crea categorías como «Biblia», «Teología» o «Liturgia»." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
              {items.map((c) => (
                <CategoryRow key={c.id} category={c} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <CategoryDialog item={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar categoría?"
        description={
          deleting?.courseCount
            ? `${pluralize(deleting.courseCount, "curso quedará", "cursos quedarán")} sin categoría.`
            : "Esta acción no se puede deshacer."
        }
        pending={pending}
        onConfirm={() =>
          deleting &&
          run(() => deleteCategoryAction(deleting.id), { success: "Categoría eliminada.", onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

function CategoryRow({ category: c, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-center gap-3 bg-card px-3 py-3", isDragging && "relative z-10 opacity-60 shadow-lift")}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
        aria-label={`Mover ${c.name}`}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{c.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          /{c.slug} · {pluralize(c.courseCount, "curso")}
          {c.description && ` · ${c.description}`}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Editar ${c.name}`}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Eliminar ${c.name}`} className="text-muted-foreground hover:text-destructive">
        <Trash2 />
      </Button>
    </li>
  );
}

function CategoryDialog({ item, onClose }: { item: Category | "new" | null; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();

  React.useEffect(() => {
    setError(null);
    setName(item && item !== "new" ? item.name : "");
    setDescription(item && item !== "new" ? (item.description ?? "") : "");
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item === "new" ? "Nueva categoría" : "Editar categoría"} size="sm">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveCategoryAction(item && item !== "new" ? item.id : null, { name, description }), {
              success: item === "new" ? "Categoría creada." : "Categoría actualizada.",
              onSuccess: onClose,
              onError: setError,
            });
          }}
        >
          <Field label="Nombre" htmlFor="cat-name" error={error}>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              autoFocus
              maxLength={80}
            />
          </Field>
          <Field label="Descripción" htmlFor="cat-desc" optional>
            <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!name.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
