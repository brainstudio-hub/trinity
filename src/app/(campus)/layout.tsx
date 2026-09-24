import Link from "next/link";
import { Search } from "lucide-react";
import { CampusSidebar, MobileNav } from "@/components/campus/campus-nav";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/brand";
import { requireUser, isStaff } from "@/lib/session";

export default async function CampusLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const staff = isStaff(user.role);

  return (
    <div className="min-h-screen">
      <CampusSidebar staff={staff} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <MobileNav staff={staff} />
              <div className="lg:hidden">
                <Logo href="/inicio" compact />
              </div>
              <form action="/cursos" className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  placeholder="Buscar cursos…"
                  className="h-9 w-72 rounded-full border bg-surface pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-tas-blue focus:ring-2 focus:ring-tas-blue/15"
                />
              </form>
            </div>
            <div className="flex items-center gap-3">
              {staff && (
                <Link href="/admin" className="hidden text-sm font-semibold text-tas-blue hover:underline sm:block">
                  Administración
                </Link>
              )}
              <UserMenu user={user} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
