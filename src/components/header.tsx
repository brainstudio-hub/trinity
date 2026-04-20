import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">Seminario Anglicano Trinity</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">
            Cursos
          </Link>
          {session ? (
            <div className="flex items-center gap-4">
              {session.user?.role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-medium text-primary hover:opacity-80">
                  Panel Admin
                </Link>
              )}
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-sm text-muted-foreground font-medium">
                  {session.user?.name}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <Button variant="outline" size="sm" className="h-8">
                    Cerrar Sesión
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
