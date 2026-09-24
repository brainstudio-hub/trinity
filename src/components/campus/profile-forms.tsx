"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FormAlert } from "@/components/auth/auth-forms";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/profile";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending}>{children}</Button>;
}

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; headline: string | null; bio: string | null; avatarUrl: string | null };
}) {
  const [state, action] = useFormState(updateProfileAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormAlert state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre completo" htmlFor="name" error={fe.name} hint="Así aparecerá en tus certificados.">
          <Input id="name" name="name" defaultValue={user.name} required />
        </Field>
        <Field label="Correo electrónico" htmlFor="email" hint="Para cambiarlo, escribe a la coordinación académica.">
          <Input id="email" value={user.email} disabled readOnly />
        </Field>
      </div>
      <Field label="Descripción breve" htmlFor="headline" error={fe.headline} optional>
        <Input id="headline" name="headline" defaultValue={user.headline ?? ""} placeholder="p. ej. Estudiante de M.Div., Diócesis de Bogotá" />
      </Field>
      <Field label="Foto de perfil (enlace)" htmlFor="avatarUrl" error={fe.avatarUrl} optional>
        <Input id="avatarUrl" name="avatarUrl" defaultValue={user.avatarUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Sobre ti" htmlFor="bio" error={fe.bio} optional>
        <Textarea id="bio" name="bio" defaultValue={user.bio ?? ""} placeholder="Tu ministerio, tu iglesia, tus intereses de estudio…" />
      </Field>
      <div className="flex justify-end">
        <Submit>Guardar cambios</Submit>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePasswordAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormAlert state={state} />
      <Field label="Contraseña actual" htmlFor="currentPassword" error={fe.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nueva contraseña" htmlFor="password" error={fe.password} hint="Mínimo 8 caracteres, con letras y números.">
          <Input id="password" name="password" type="password" autoComplete="new-password" />
        </Field>
        <Field label="Confirmar contraseña" htmlFor="confirmPassword" error={fe.confirmPassword}>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Submit>Cambiar contraseña</Submit>
      </div>
    </form>
  );
}
