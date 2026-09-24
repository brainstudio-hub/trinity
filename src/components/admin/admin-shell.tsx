"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  Tags,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/next-auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/cursos", label: "Cursos", icon: BookOpen },
  { href: "/admin/calificaciones", label: "Calificaciones", icon: ClipboardCheck },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/admin/docentes", label: "Docentes", icon: GraduationCap, adminOnly: true },
  { href: "/admin/categorias", label: "Categorías", icon: Tags, adminOnly: true },
  { href: "/admin/comunicaciones", label: "Anuncios y eventos", icon: Megaphone, adminOnly: true },
];

// ── Migas de pan: cada página declara las suyas con <AdminBreadcrumbs /> ──
export type Crumb = { label: string; href?: string };
const CrumbContext = React.createContext<React.Dispatch<React.SetStateAction<Crumb[] | null>> | null>(null);

export function AdminBreadcrumbs({ items }: { items: Crumb[] }) {
  const set = React.useContext(CrumbContext);
  const key = JSON.stringify(items);
  React.useEffect(() => {
    set?.(JSON.parse(key) as Crumb[]);
    return () => set?.(null);
  }, [key, set]);
  return null;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function fallbackCrumbs(pathname: string): Crumb[] {
  const item = [...NAV].reverse().find((n) => isActive(pathname, n.href));
  return item ? [{ label: item.label }] : [];
}

type ShellUser = { name: string; email: string; role: AppRole; avatarUrl: string | null };

function SidebarNav({ role, pathname, onNavigate }: { role: AppRole; pathname: string; onNavigate?: () => void }) {
  const items = NAV.filter((n) => !n.adminOnly || role === "ADMIN");
  const main = items.filter((n) => !n.adminOnly);
  const admin = items.filter((n) => n.adminOnly);
  const renderItem = (n: NavItem) => {
    const active = isActive(pathname, n.href);
    const Icon = n.icon;
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[0.8125rem] font-medium transition-colors",
            active ? "bg-white/[0.08] text-white" : "text-tas-cream/65 hover:bg-white/[0.05] hover:text-tas-cream"
          )}
        >
          {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-tas-crimson" aria-hidden />}
          <Icon className={cn("size-4 shrink-0", active ? "text-tas-gold" : "text-tas-cream/50 group-hover:text-tas-cream/80")} />
          {n.label}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Administración" className="flex flex-1 flex-col gap-6 px-3">
      <div>
        <p className="mb-2 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-tas-cream/40">Académico</p>
        <ul className="space-y-0.5">{main.map(renderItem)}</ul>
      </div>
      {admin.length > 0 && (
        <div>
          <p className="mb-2 px-3 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-tas-cream/40">Institución</p>
          <ul className="space-y-0.5">{admin.map(renderItem)}</ul>
        </div>
      )}
      <div className="mt-auto border-t border-white/10 pb-4 pt-4">
        <Link
          href="/inicio"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[0.8125rem] font-medium text-tas-cream/65 transition-colors hover:bg-white/[0.05] hover:text-tas-cream"
        >
          <ArrowLeft className="size-4 text-tas-cream/50" />
          Volver al campus
        </Link>
      </div>
    </nav>
  );
}

export function AdminShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [crumbs, setCrumbs] = React.useState<Crumb[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const items = crumbs ?? fallbackCrumbs(pathname);

  return (
    <CrumbContext.Provider value={setCrumbs}>
      <div className="min-h-screen bg-background">
        {/* Barra lateral (escritorio) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-tas-navy-deep lg:flex">
          <div className="flex h-16 items-center px-6">
            <Logo href="/admin" inverse />
          </div>
          <p className="mb-5 px-6 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-tas-gold/80">
            Administración
          </p>
          <SidebarNav role={user.role} pathname={pathname} />
        </aside>

        <div className="lg:pl-[248px]">
          {/* Barra superior */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-8">
            <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
              <SheetPrimitive.Trigger
                className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-tas-navy transition hover:bg-secondary lg:hidden"
                aria-label="Abrir menú de administración"
              >
                <Menu className="size-5" />
              </SheetPrimitive.Trigger>
              <SheetPrimitive.Portal>
                <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-tas-navy-deep/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
                <SheetPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col bg-tas-navy-deep shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden">
                  <SheetPrimitive.Title className="sr-only">Menú de administración</SheetPrimitive.Title>
                  <SheetPrimitive.Description className="sr-only">Navegación del panel de administración</SheetPrimitive.Description>
                  <div className="flex h-16 items-center justify-between px-5">
                    <Logo href="/admin" inverse />
                    <SheetPrimitive.Close
                      className="inline-flex size-8 items-center justify-center rounded-md text-tas-cream/70 hover:bg-white/10 hover:text-white"
                      aria-label="Cerrar menú"
                    >
                      <X className="size-4" />
                    </SheetPrimitive.Close>
                  </div>
                  <p className="mb-5 px-5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-tas-gold/80">
                    Administración
                  </p>
                  <SidebarNav role={user.role} pathname={pathname} onNavigate={() => setOpen(false)} />
                </SheetPrimitive.Content>
              </SheetPrimitive.Portal>
            </SheetPrimitive.Root>

            <nav aria-label="Ruta de navegación" className="min-w-0 flex-1">
              <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                <li className="hidden shrink-0 sm:block">
                  <Link href="/admin" className="text-muted-foreground transition hover:text-foreground">
                    Administración
                  </Link>
                </li>
                {items.map((c, i) => {
                  const last = i === items.length - 1;
                  return (
                    <li key={`${c.label}-${i}`} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}>
                      <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground/60", i === 0 && "hidden sm:block")} />
                      {c.href && !last ? (
                        <Link href={c.href} className="truncate text-muted-foreground transition hover:text-foreground">
                          {c.label}
                        </Link>
                      ) : (
                        <span className="truncate font-semibold text-tas-navy" aria-current={last ? "page" : undefined}>
                          {c.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <UserMenu user={user} />
          </header>

          <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-8 md:px-8">{children}</main>
        </div>
      </div>
    </CrumbContext.Provider>
  );
}
