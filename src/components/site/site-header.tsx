import Link from "next/link";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/cursos" className="transition hover:text-tas-navy">Catálogo</Link>
            <a href="https://tas.edu" target="_blank" rel="noreferrer" className="transition hover:text-tas-navy">
              El Seminario
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/inicio">Mi aprendizaje</Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/ingresar">Ingresar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-tas-navy-deep text-tas-cream/70">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo inverse />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Programa hispano del Seminario Anglicano Trinity. Formación bíblica, teológica y pastoral para servir a la
            Iglesia en el mundo hispanohablante.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4 !text-tas-cream/50">Campus</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/cursos" className="hover:text-tas-cream">Catálogo de cursos</Link></li>
            <li><Link href="/ingresar" className="hover:text-tas-cream">Ingresar</Link></li>
            <li><Link href="/registro" className="hover:text-tas-cream">Crear cuenta</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 !text-tas-cream/50">Seminario</p>
          <ul className="space-y-2.5 text-sm">
            <li><a href="https://tas.edu" target="_blank" rel="noreferrer" className="hover:text-tas-cream">tas.edu</a></li>
            <li>311 Eleventh Street, Ambridge, PA</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col justify-between gap-2 py-5 text-xs text-tas-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Trinity Anglican Seminary. Todos los derechos reservados.</p>
          <p>Formando líderes anglicanos para la misión.</p>
        </div>
      </div>
    </footer>
  );
}
