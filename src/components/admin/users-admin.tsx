"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Eye, EyeOff, KeyRound, MoreHorizontal, RefreshCw, Shield, UserPlus, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Avatar, Badge, EmptyState } from "@/components/ui/primitives";
import {
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { createUserAction, generateResetLinkAction, updateUserAccessAction } from "@/lib/actions/admin/users";
import { formatRelative } from "@/lib/utils";
import { ConfirmDialog, CopyButton, useAdminAction } from "./admin-kit";
import { ROLE_LABEL, RoleBadge, type RoleValue } from "./labels";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  courses: number;
};

export function UsersTable({ users, meId, filtered }: { users: UserRow[]; meId: string; filtered: boolean }) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title={filtered ? "Sin resultados" : "No hay usuarios"}
        description={filtered ? "Ninguna cuenta coincide con tu búsqueda." : "Crea la primera cuenta con el botón de arriba."}
      />
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="hidden grid-cols-[1fr_130px_80px_130px_90px_40px] gap-4 border-b bg-secondary/40 px-5 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
        <span>Usuario</span>
        <span>Rol</span>
        <span className="text-right">Cursos</span>
        <span>Último acceso</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>
      <ul className="divide-y">
        {users.map((u) => (
          <UserRowItem key={u.id} user={u} isMe={u.id === meId} />
        ))}
      </ul>
      {users.length >= 200 && (
        <p className="border-t bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
          Mostrando los 200 más recientes. Usa la búsqueda para encontrar otras cuentas.
        </p>
      )}
    </div>
  );
}

function UserRowItem({ user: u, isMe }: { user: UserRow; isMe: boolean }) {
  const [pending, run] = useAdminAction();
  const [confirm, setConfirm] = React.useState<null | { kind: "role"; role: RoleValue } | { kind: "suspend" }>(null);
  const [resetUrl, setResetUrl] = React.useState<string | null>(null);

  const apply = (change: { role?: RoleValue; isActive?: boolean }, success: string) =>
    run(() => updateUserAccessAction(u.id, change), { success, onSuccess: () => setConfirm(null) });

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 lg:grid-cols-[1fr_130px_80px_130px_90px_40px] lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={u.name} src={u.avatarUrl} size={36} className={u.isActive ? undefined : "opacity-50"} />
        <div className="min-w-0">
          <Link href={`/admin/usuarios/${u.id}`} className="block truncate text-sm font-semibold hover:text-tas-blue hover:underline">
            {u.name}
            {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 lg:hidden">
            <RoleBadge role={u.role} />
            {!u.isActive && <Badge variant="outline">Suspendido</Badge>}
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <RoleBadge role={u.role} />
      </div>
      <p className="hidden text-right text-sm tabular-nums lg:block">{u.courses}</p>
      <p className="hidden text-xs text-muted-foreground lg:block" suppressHydrationWarning>{u.lastLoginAt ? formatRelative(u.lastLoginAt) : "Nunca"}</p>
      <div className="hidden lg:block">
        {u.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
            <span className="size-1.5 rounded-full bg-success" /> Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground/50" /> Suspendido
          </span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.name}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuItem asChild>
            <Link href={`/admin/usuarios/${u.id}`}>
              <UserRound /> Ver detalle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Cambiar rol</DropdownMenuLabel>
          {(Object.keys(ROLE_LABEL) as RoleValue[]).map((r) => (
            <DropdownMenuItem key={r} disabled={r === u.role || (isMe && r !== "ADMIN")} onSelect={() => setConfirm({ kind: "role", role: r })}>
              <Shield /> {ROLE_LABEL[r]}
              {r === u.role && <CheckCircle2 className="ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              run(() => generateResetLinkAction(u.id), { onSuccess: (r) => setResetUrl(r.url) })
            }
          >
            <KeyRound /> Generar enlace de restablecimiento
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {u.isActive ? (
            <DropdownMenuItem destructive disabled={isMe} onSelect={() => setConfirm({ kind: "suspend" })}>
              <Ban /> Suspender cuenta
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => apply({ isActive: true }, `${u.name} fue reactivado.`)}>
              <CheckCircle2 /> Reactivar cuenta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm?.kind === "role"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`¿Cambiar rol a ${confirm?.kind === "role" ? ROLE_LABEL[confirm.role] : ""}?`}
        description={
          confirm?.kind === "role" && confirm.role === "ADMIN"
            ? `${u.name} tendrá acceso total a la administración del campus.`
            : confirm?.kind === "role" && confirm.role === "INSTRUCTOR"
              ? `${u.name} podrá crear cursos y administrar aquellos donde figure como docente. Vincula su cuenta a un perfil en Docentes.`
              : `${u.name} perderá el acceso al panel de administración.`
        }
        confirmLabel="Cambiar rol"
        destructive={false}
        pending={pending}
        onConfirm={() => confirm?.kind === "role" && apply({ role: confirm.role }, "Rol actualizado.")}
      />
      <ConfirmDialog
        open={confirm?.kind === "suspend"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="¿Suspender esta cuenta?"
        description={`${u.name} no podrá ingresar al campus hasta que reactives su cuenta. Su historial se conserva.`}
        confirmLabel="Suspender"
        pending={pending}
        onConfirm={() => apply({ isActive: false }, "Cuenta suspendida.")}
      />
      <ResetLinkDialog url={resetUrl} name={u.name} onClose={() => setResetUrl(null)} />
    </li>
  );
}

export function ResetLinkDialog({ url, name, onClose }: { url: string | null; name: string; onClose: () => void }) {
  return (
    <Dialog open={!!url} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Enlace de restablecimiento"
        description={`Compártelo con ${name} por un medio seguro. Es de un solo uso y vence en 1 hora.`}
        size="md"
      >
        <div className="space-y-4">
          <Input readOnly value={url ?? ""} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" aria-label="Enlace" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            {url && <CopyButton value={url} label="Copiar enlace" />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Crear usuario ──────────────────────────────────────────────
// Mismas reglas que passwordIssues (dominio); se validan de nuevo en el servidor.
function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Debe tener al menos 8 caracteres.");
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)) issues.push("Debe incluir al menos una letra.");
  if (!/\d/.test(password)) issues.push("Debe incluir al menos un número.");
  return issues;
}

function generatePassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + digits;
  const rand = (n: number) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % n;
  };
  const chars = [letters[rand(letters.length)], digits[rand(digits.length)]];
  while (chars.length < 12) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function CreateUserButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<RoleValue>("STUDENT");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<{ id: string; email: string; password: string } | null>(null);
  const [pending, run] = useAdminAction();

  const reset = () => {
    setName("");
    setEmail("");
    setRole("STUDENT");
    setPassword(generatePassword());
    setShow(true);
    setError(null);
    setCreated(null);
  };

  const issues = password ? passwordIssues(password) : [];

  return (
    <>
      <Button
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <UserPlus /> Nuevo usuario
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={created ? "Cuenta creada" : "Nuevo usuario"}
          description={created ? "Comparte estas credenciales por un medio seguro." : "La persona podrá cambiar su contraseña al ingresar."}
          size="md"
        >
          {created ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border bg-secondary/40 p-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Correo: </span>
                  <span className="font-medium">{created.email}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Contraseña temporal: </span>
                  <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{created.password}</code>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Por seguridad, esta contraseña no se volverá a mostrar.</p>
              <div className="flex flex-wrap justify-end gap-2">
                <CopyButton value={`Correo: ${created.email}\nContraseña temporal: ${created.password}`} label="Copiar credenciales" />
                <Button
                  onClick={() => {
                    setOpen(false);
                    router.push(`/admin/usuarios/${created.id}`);
                  }}
                >
                  Ver usuario
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                run(() => createUserAction({ name, email, role, password }), {
                  success: "Cuenta creada.",
                  onSuccess: (r) => setCreated({ id: r.id, email: email.trim().toLowerCase(), password }),
                  onError: setError,
                });
              }}
            >
              <Field label="Nombre completo" htmlFor="nu-name">
                <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={120} />
              </Field>
              <Field label="Correo electrónico" htmlFor="nu-email">
                <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
              </Field>
              <Field label="Rol" htmlFor="nu-role">
                <Select id="nu-role" value={role} onChange={(e) => setRole(e.target.value as RoleValue)}>
                  {(Object.keys(ROLE_LABEL) as RoleValue[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Contraseña temporal" htmlFor="nu-pass" error={issues[0] ?? null} hint="Mínimo 8 caracteres, con letras y números.">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="nu-pass"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 font-mono"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())} aria-label="Generar otra contraseña" title="Generar otra">
                    <RefreshCw />
                  </Button>
                </div>
              </Field>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={pending} disabled={!name.trim() || !email.trim() || issues.length > 0}>
                  Crear cuenta
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Acciones de la ficha de usuario (rol, estado y enlace de restablecimiento). */
export function UserDetailActions({ user, isMe }: { user: Pick<UserRow, "id" | "name" | "role" | "isActive">; isMe: boolean }) {
  const [pending, run] = useAdminAction();
  const [resetUrl, setResetUrl] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<RoleValue>(user.role);
  const [confirmSuspend, setConfirmSuspend] = React.useState(false);

  React.useEffect(() => setRole(user.role), [user.role]);

  return (
    <div className="space-y-4">
      <Field label="Rol" htmlFor="detail-role" hint={isMe ? "No puedes cambiar tu propio rol." : undefined}>
        <div className="flex gap-2">
          <Select id="detail-role" value={role} onChange={(e) => setRole(e.target.value as RoleValue)} disabled={isMe}>
            {(Object.keys(ROLE_LABEL) as RoleValue[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            disabled={role === user.role || isMe}
            loading={pending && role !== user.role}
            onClick={() => run(() => updateUserAccessAction(user.id, { role }), { success: "Rol actualizado.", onError: () => setRole(user.role) })}
          >
            Guardar
          </Button>
        </div>
      </Field>
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => run(() => generateResetLinkAction(user.id), { onSuccess: (r) => setResetUrl(r.url) })}>
          <KeyRound /> Generar enlace de restablecimiento
        </Button>
        {user.isActive ? (
          <Button variant="outline" className="text-destructive hover:text-destructive" disabled={isMe} onClick={() => setConfirmSuspend(true)}>
            <Ban /> Suspender cuenta
          </Button>
        ) : (
          <Button variant="outline" onClick={() => run(() => updateUserAccessAction(user.id, { isActive: true }), { success: "Cuenta reactivada." })}>
            <CheckCircle2 /> Reactivar cuenta
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        title="¿Suspender esta cuenta?"
        description={`${user.name} no podrá ingresar al campus hasta que reactives su cuenta.`}
        confirmLabel="Suspender"
        pending={pending}
        onConfirm={() =>
          run(() => updateUserAccessAction(user.id, { isActive: false }), {
            success: "Cuenta suspendida.",
            onSuccess: () => setConfirmSuspend(false),
          })
        }
      />
      <ResetLinkDialog url={resetUrl} name={user.name} onClose={() => setResetUrl(null)} />
    </div>
  );
}

