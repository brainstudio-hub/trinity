"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  Home,
  Menu,
  NotebookPen,
  Settings2,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/mis-cursos", label: "Mis cursos", icon: BookOpen },
  { href: "/cursos", label: "Catálogo", icon: Compass },
  { href: "/notas", label: "Mis notas", icon: NotebookPen },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/mis-certificados", label: "Certificados", icon: GraduationCap },
];

function NavLinks({ staff, onNavigate }: { staff: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const item = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-tas-navy text-tas-cream" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className={cn("size-[18px]", active ? "text-tas-gold" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.8} />
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => item(n.href, n.label, n.icon))}
      {staff && (
        <>
          <p className="eyebrow mb-1 mt-6 px-3">Equipo docente</p>
          {item("/admin", "Administración", Settings2)}
        </>
      )}
    </nav>
  );
}

export function CampusSidebar({ staff }: { staff: boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-surface lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo href="/inicio" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-6 scrollbar-thin">
        <p className="eyebrow mb-2 px-3">Campus</p>
        <NavLinks staff={staff} />
      </div>
      <div className="m-3 rounded-lg bg-tas-cream p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-tas-navy">¿Necesitas ayuda?</p>
        <p className="mt-1">Escribe a la coordinación académica del programa hispano.</p>
      </div>
    </aside>
  );
}

export function MobileNav({ staff }: { staff: boolean }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="-ml-2 rounded-md p-2 text-foreground hover:bg-secondary lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-tas-navy-deep/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-lift animate-fade-in">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo href="/inicio" />
              <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-secondary" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            <div className="px-3 py-4">
              <NavLinks staff={staff} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
