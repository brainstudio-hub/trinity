"use client";

import * as React from "react";
import { GraduationCap, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { deleteInstructorAction, saveInstructorAction } from "@/lib/actions/admin/catalog";
import { pluralize } from "@/lib/utils";
import { ConfirmDialog, useAdminAction } from "./admin-kit";
import { ROLE_LABEL, type RoleValue } from "./labels";

type Instructor = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  courseCount: number;
};
type Account = { id: string; name: string; email: string; role: RoleValue; profileId: string | null };

export function InstructorsManager({ instructors, accounts }: { instructors: Instructor[]; accounts: Account[] }) {
  const [editing, setEditing] = React.useState<Instructor | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Instructor | null>(null);
  const [pending, run] = useAdminAction();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus /> Nuevo docente
        </Button>
      </div>

      {instructors.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title="Aún no hay docentes"
          description="Crea los perfiles de los profesores para asignarlos a los cursos."
          action={
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus /> Crear perfil
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {instructors.map((i) => (
            <li key={i.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={i.name} src={i.photoUrl} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg leading-tight text-tas-navy">{i.name}</p>
                    {i.title && <p className="mt-0.5 text-xs text-muted-foreground">{i.title}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{pluralize(i.courseCount, "curso")}</p>
                  </div>
                </div>
                {i.bio && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{i.bio}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  {i.user ? (
                    <Badge variant="blue" className="max-w-[60%] normal-case tracking-normal" title={i.user.email}>
                      <Link2 className="size-3 shrink-0" />
                      <span className="truncate">{i.user.email}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="normal-case tracking-normal">
                      Sin cuenta
                    </Badge>
                  )}
                  <div className="flex">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(i)} aria-label={`Editar a ${i.name}`}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting(i)}
                      aria-label={`Eliminar a ${i.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <InstructorDialog item={editing} accounts={accounts} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar perfil docente?"
        description={
          deleting
            ? deleting.courseCount
              ? `${deleting.name} dejará de aparecer en ${pluralize(deleting.courseCount, "curso")}. La cuenta de usuario vinculada no se elimina.`
              : "La cuenta de usuario vinculada (si existe) no se elimina."
            : undefined
        }
        pending={pending}
        onConfirm={() =>
          deleting &&
          run(() => deleteInstructorAction(deleting.id), { success: "Perfil eliminado.", onSuccess: () => setDeleting(null) })
        }
      />
    </div>
  );
}

function InstructorDialog({ item, accounts, onClose }: { item: Instructor | "new" | null; accounts: Account[]; onClose: () => void }) {
  const [v, setV] = React.useState({ name: "", title: "", bio: "", photoUrl: "", userId: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, run] = useAdminAction();
  const selfId = item && item !== "new" ? item.id : null;

  React.useEffect(() => {
    setError(null);
    if (item && item !== "new") {
      setV({ name: item.name, title: item.title ?? "", bio: item.bio ?? "", photoUrl: item.photoUrl ?? "", userId: item.userId ?? "" });
    } else if (item === "new") {
      setV({ name: "", title: "", bio: "", photoUrl: "", userId: "" });
    }
  }, [item]);

  const set = (k: keyof typeof v, val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setError(null);
  };
  const selectable = accounts.filter((a) => !a.profileId || a.profileId === selfId);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item === "new" ? "Nuevo docente" : "Editar docente"} size="lg">
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveInstructorAction(selfId, v), {
              success: item === "new" ? "Docente creado." : "Docente actualizado.",
              onSuccess: onClose,
              onError: setError,
            });
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar name={v.name || "?"} src={/^https?:\/\//.test(v.photoUrl) ? v.photoUrl : null} size={56} />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="ins-name">
                <Input id="ins-name" value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Rev. Dr. Juan Pérez" autoFocus maxLength={120} />
              </Field>
              <Field label="Cargo o título" htmlFor="ins-title" optional>
                <Input id="ins-title" value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Profesor de Nuevo Testamento" maxLength={160} />
              </Field>
            </div>
          </div>
          <Field label="URL de la foto" htmlFor="ins-photo" optional hint="Imagen cuadrada, idealmente de al menos 400 × 400 px.">
            <Input id="ins-photo" type="url" value={v.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Biografía" htmlFor="ins-bio" optional>
            <Textarea id="ins-bio" value={v.bio} onChange={(e) => set("bio", e.target.value)} rows={5} maxLength={5000} />
          </Field>
          <Field
            label="Cuenta vinculada"
            htmlFor="ins-user"
            optional
            hint="Solo cuentas con rol Docente o Administrador. Permite que administre los cursos donde figura."
          >
            <Select id="ins-user" value={v.userId} onChange={(e) => set("userId", e.target.value)}>
              <option value="">Sin cuenta (docente invitado)</option>
              {selectable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.email} ({ROLE_LABEL[a.role]})
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending} disabled={!v.name.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
