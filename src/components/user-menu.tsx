"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, NotebookPen, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { logoutAction } from "@/lib/actions/auth";
import type { AppRole } from "@/types/next-auth";

const ROLE_LABEL: Record<AppRole, string> = { STUDENT: "Estudiante", INSTRUCTOR: "Docente", ADMIN: "Administrador" };

export function UserMenu({
  user,
  inverse,
}: {
  user: { name: string; email: string; role: AppRole; avatarUrl: string | null };
  inverse?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-2.5 rounded-full p-0.5 pr-1 outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${inverse ? "hover:bg-white/10" : "hover:bg-secondary"}`}
        aria-label="Menú de usuario"
      >
        <Avatar name={user.name} src={user.avatarUrl} size={34} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>
          <p className="truncate font-semibold text-tas-navy">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{ROLE_LABEL[user.role]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/inicio"><LayoutDashboard /> Inicio</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mis-cursos"><BookOpen /> Mis cursos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notas"><NotebookPen /> Mis notas</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mis-certificados"><GraduationCap /> Certificados</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/perfil"><UserRound /> Perfil</Link>
        </DropdownMenuItem>
        {(user.role === "ADMIN" || user.role === "INSTRUCTOR") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin"><Settings /> Administración</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full"><LogOut /> Cerrar sesión</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
