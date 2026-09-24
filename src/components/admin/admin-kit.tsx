"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Copy, Eye, Pencil, Plus, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/admin/types";

// ── Ejecutar acciones con toasts ───────────────────────────────
type Success<T> = Extract<T, { ok: true }>;

export function useAdminAction() {
  const [pending, startTransition] = React.useTransition();
  const run = React.useCallback(
    <T extends ActionResult<object>>(
      fn: () => Promise<T>,
      opts: { success?: string | ((r: Success<T>) => string); onSuccess?: (r: Success<T>) => void; onError?: (e: string) => void } = {}
    ) => {
      startTransition(async () => {
        try {
          const res = await fn();
          if (res.ok) {
            const ok = res as Success<T>;
            const msg = typeof opts.success === "function" ? opts.success(ok) : opts.success;
            if (msg) toast.success(msg);
            opts.onSuccess?.(ok);
          } else {
            toast.error(res.error);
            opts.onError?.(res.error);
          }
        } catch (error) {
          console.error(error);
          const msg = "Se perdió la conexión con el servidor. Revisa tu internet e intenta de nuevo.";
          toast.error(msg);
          opts.onError?.(msg);
        }
      });
    },
    []
  );
  return [pending, run] as const;
}

// ── Diálogo de confirmación ────────────────────────────────────
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Eliminar",
  destructive = true,
  requireText,
  pending,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Si se indica, el usuario debe escribir este texto para confirmar. */
  requireText?: string;
  pending?: boolean;
  onConfirm: (typed: string) => void;
  children?: React.ReactNode;
}) {
  const [typed, setTyped] = React.useState("");
  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const blocked = !!requireText && typed.trim() !== requireText.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!blocked) onConfirm(typed);
          }}
          className="space-y-5"
        >
          {children}
          {requireText && (
            <div className="space-y-1.5">
              <label htmlFor="confirm-text" className="text-[0.8125rem] text-muted-foreground">
                Escribe <span className="font-semibold text-foreground">{requireText}</span> para confirmar.
              </label>
              <Input id="confirm-text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} loading={pending} disabled={blocked}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Editor markdown con vista previa ───────────────────────────
export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 10,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const [preview, setPreview] = React.useState(false);
  return (
    <div className={cn("overflow-hidden rounded-md border border-input bg-surface", className)}>
      <div className="flex items-center justify-between border-b bg-secondary/50 px-2 py-1.5">
        <div role="tablist" aria-label="Modo del editor" className="flex gap-1">
          {[
            { key: false, label: "Escribir", icon: Pencil },
            { key: true, label: "Vista previa", icon: Eye },
          ].map((m) => (
            <button
              key={m.label}
              type="button"
              role="tab"
              aria-selected={preview === m.key}
              onClick={() => setPreview(m.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition",
                preview === m.key ? "bg-surface text-tas-navy shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon className="size-3.5" />
              {m.label}
            </button>
          ))}
        </div>
        <span className="hidden text-2xs text-muted-foreground sm:inline">Admite Markdown: **negrita**, ## títulos, - listas, [enlaces](https://…)</span>
      </div>
      {preview ? (
        <div className="min-h-[160px] px-4 py-3" style={{ minHeight: rows * 24 }}>
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm italic text-muted-foreground">Nada que previsualizar todavía.</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="rounded-none border-0 font-mono text-[0.8125rem] shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  );
}

// ── Lista dinámica de textos ───────────────────────────────────
export function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel = "Agregar",
  max = 30,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  max?: number;
}) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || value.length >= max) return;
    onChange([...value, v]);
    setDraft("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((item, i) => (
            <li key={i} className="group flex items-center gap-2 rounded-md border bg-surface py-1 pl-3 pr-1">
              <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}.</span>
              <input
                value={item}
                onChange={(e) => onChange(value.map((v, k) => (k === i ? e.target.value : v)))}
                className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                aria-label={`Elemento ${i + 1}`}
              />
              <div className="flex shrink-0 items-center">
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Bajar"
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onChange(value.filter((_, k) => k !== i))}
                  aria-label="Quitar"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          disabled={value.length >= max}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim() || value.length >= max}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </div>
  );
}

// ── Búsqueda con parámetro en la URL ───────────────────────────
export function SearchInput({ placeholder = "Buscar…", param = "q", className }: { placeholder?: string; param?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get(param) ?? "");
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    const current = params.get(param) ?? "";
    if (value.trim() === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set(param, value.trim());
      else next.delete(param);
      startTransition(() => router.replace((next.toString() ? `${pathname}?${next.toString()}` : pathname), { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [value, params, param, pathname, router]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}

/** Select que actualiza un parámetro de búsqueda en la URL. */
export function ParamSelect({
  param,
  options,
  allLabel,
  label,
  className,
}: {
  param: string;
  options: { value: string; label: string }[];
  allLabel: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label={label}
      value={params.get(param) ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value) next.set(param, e.target.value);
        else next.delete(param);
        router.replace((next.toString() ? `${pathname}?${next.toString()}` : pathname), { scroll: false });
      }}
      className={cn(
        "h-10 rounded-md border border-input bg-surface pl-3 pr-8 text-sm text-foreground focus-visible:border-tas-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tas-blue/15",
        className
      )}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Copiar al portapapeles ─────────────────────────────────────
export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copiado al portapapeles.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("No pudimos copiar. Selecciona el texto y cópialo manualmente.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

// ── Sección de formulario (título a la izquierda, campos a la derecha) ──
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-6 border-b py-8 first:pt-0 last:border-0 lg:grid-cols-[260px_1fr] lg:gap-10", className)}>
      <div>
        <h2 className="text-[0.9375rem] font-semibold text-tas-navy">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

// ── Barra inferior de guardado ─────────────────────────────────
export function SaveBar({ dirty, pending, onReset, label = "Guardar cambios" }: { dirty: boolean; pending: boolean; onReset?: () => void; label?: string }) {
  return (
    <div
      className={
        "fixed inset-x-0 bottom-0 z-20 border-t bg-surface/95 backdrop-blur transition-transform duration-200 lg:left-[248px] " +
        (dirty ? "translate-y-0" : "translate-y-full")
      }
      aria-hidden={!dirty}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-end gap-3 px-4 py-3 sm:justify-between md:px-8">
        <p className="hidden text-sm text-muted-foreground sm:block">
          <span className="mr-2 inline-block size-2 rounded-full bg-tas-gold align-middle" aria-hidden />
          Tienes cambios sin guardar
        </p>
        <div className="flex gap-2">
          {onReset && (
            <Button type="button" variant="ghost" onClick={onReset} disabled={pending} tabIndex={dirty ? 0 : -1}>
              Descartar
            </Button>
          )}
          <Button type="submit" loading={pending} tabIndex={dirty ? 0 : -1}>
            <Save /> {label}
          </Button>
        </div>
      </div>
    </div>
  );
}
