"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/actions/auth";
import type { ActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {children}
    </Button>
  );
}

export function FormAlert({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <div role="alert" className="flex gap-2.5 rounded-md border border-destructive/20 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.message) {
    return (
      <div role="status" className="flex gap-2.5 rounded-md border border-success/20 bg-success/[0.06] px-3.5 py-3 text-sm text-success">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }
  return null;
}

function PasswordInput({ invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} aria-invalid={invalid} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="display text-[2.4rem] leading-[1.1]">{title}</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Ingresar ───────────────────────────────────────────────────
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useFormState(loginAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <Heading
        eyebrow="Campus virtual"
        title="Bienvenido de nuevo"
        description="Ingresa con tu correo institucional o personal para continuar tus estudios."
      />
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <FormAlert state={state} />
        <Field label="Correo electrónico" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" aria-invalid={!!fe.email} required autoFocus />
        </Field>
        <Field
          label="Contraseña"
          htmlFor="password"
          error={fe.password}
        >
          <PasswordInput id="password" name="password" autoComplete="current-password" invalid={!!fe.password} required />
        </Field>
        <div className="-mt-1 flex justify-end">
          <Link href="/recuperar" className="text-xs font-semibold text-tas-blue hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <SubmitButton>Ingresar</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-tas-navy underline-offset-4 hover:underline">
          Crear una cuenta
        </Link>
      </p>
    </>
  );
}

// ── Registro ───────────────────────────────────────────────────
export function RegisterForm() {
  const [state, action] = useFormState(registerAction, {});
  const fe = state.fieldErrors ?? {};
  const [password, setPassword] = React.useState("");
  const checks = [
    { ok: password.length >= 8, label: "8 caracteres" },
    { ok: /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password), label: "una letra" },
    { ok: /\d/.test(password), label: "un número" },
  ];

  return (
    <>
      <Heading
        eyebrow="Nueva cuenta"
        title="Únete al campus"
        description="Crea tu cuenta para inscribirte en los cursos y llevar tu progreso, notas y certificados."
      />
      <form action={action} className="space-y-5" noValidate>
        <FormAlert state={state} />
        <Field label="Nombre completo" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" autoComplete="name" placeholder="Como aparecerá en tu certificado" aria-invalid={!!fe.name} required autoFocus />
        </Field>
        <Field label="Correo electrónico" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" aria-invalid={!!fe.email} required />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={fe.password}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            invalid={!!fe.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {checks.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-1.5 text-xs transition-colors", c.ok ? "text-success" : "text-muted-foreground")}>
                <span className={cn("size-1.5 rounded-full", c.ok ? "bg-success" : "bg-tas-stone")} />
                {c.label}
              </li>
            ))}
          </ul>
        </Field>
        <Field label="Confirma la contraseña" htmlFor="confirmPassword" error={fe.confirmPassword}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" invalid={!!fe.confirmPassword} required />
        </Field>
        <SubmitButton>Crear cuenta</SubmitButton>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Al crear una cuenta aceptas las normas académicas y de convivencia del Seminario.
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-tas-navy underline-offset-4 hover:underline">
          Ingresar
        </Link>
      </p>
    </>
  );
}

// ── Recuperar ──────────────────────────────────────────────────
export function ForgotPasswordForm() {
  const [state, action] = useFormState(requestPasswordResetAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <Heading
        eyebrow="Recuperar acceso"
        title="¿Olvidaste tu contraseña?"
        description="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
      />
      {state.ok ? (
        <FormAlert state={state} />
      ) : (
        <form action={action} className="space-y-5" noValidate>
          <FormAlert state={state} />
          <Field label="Correo electrónico" htmlFor="email" error={fe.email}>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" aria-invalid={!!fe.email} required autoFocus />
          </Field>
          <SubmitButton>Enviar enlace</SubmitButton>
        </form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link href="/ingresar" className="font-semibold text-tas-navy underline-offset-4 hover:underline">
          ← Volver a ingresar
        </Link>
      </p>
    </>
  );
}

// ── Restablecer ────────────────────────────────────────────────
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <Heading
        eyebrow="Recuperar acceso"
        title="Crea una nueva contraseña"
        description="Usa al menos 8 caracteres, con letras y números."
      />
      {state.ok ? (
        <div className="space-y-6">
          <FormAlert state={state} />
          <Button asChild size="lg" className="w-full">
            <Link href="/ingresar">Ir a ingresar</Link>
          </Button>
        </div>
      ) : (
        <form action={action} className="space-y-5" noValidate>
          <input type="hidden" name="token" value={token} />
          <FormAlert state={state} />
          <Field label="Nueva contraseña" htmlFor="password" error={fe.password}>
            <PasswordInput id="password" name="password" autoComplete="new-password" invalid={!!fe.password} required autoFocus />
          </Field>
          <Field label="Confirma la contraseña" htmlFor="confirmPassword" error={fe.confirmPassword}>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" invalid={!!fe.confirmPassword} required />
          </Field>
          <SubmitButton>Guardar contraseña</SubmitButton>
        </form>
      )}
    </>
  );
}
