import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings, User } from "lucide-react";

export async function Header() {
  const session = await auth();

  return (
    <header className="fixed top-0 z-50 w-full border-b-0 bg-[#f8f9fb]/90 dark:bg-[#191c1e]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#f8f9fb]/60 shadow-[0_12px_40px_rgba(0,42,88,0.08)]">
      <div className="flex h-16 items-center justify-between px-8 mx-auto">
        <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-4">
                <img src="/tas-logo.png" alt="Logo TAS" className="h-10 w-auto" />
                <span className="text-xl font-headline font-semibold text-brand-navy tracking-tight hidden lg:block">Seminario Anglicano Trinity</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
                <Link href="/courses" className="text-[brand-navy] font-headline uppercase tracking-widest text-sm font-semibold border-b-2 border-[brand-navy] pb-1 transition-all duration-300 ease-in-out hover:opacity-80">
                    Catálogo
                </Link>
                <Link href="/dashboard" className="text-[#424750] font-headline uppercase tracking-widest text-sm font-medium hover:text-[brand-navy] transition-all duration-300 ease-in-out hover:opacity-80">
                    Panel
                </Link>
                <Link href="#" className="text-[#424750] font-headline uppercase tracking-widest text-sm font-medium hover:text-[brand-navy] transition-all duration-300 ease-in-out hover:opacity-80">
                    Biblioteca
                </Link>
            </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy/40" />
             <input
               type="text"
               placeholder="Buscar en el archivo..."
               className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all w-64"
             />
          </div>
          <button className="text-[brand-navy] lg:hidden scale-95 active:scale-100 transition-transform p-2 rounded-full hover:bg-surface-container-low">
            <Search className="h-5 w-5" />
          </button>

          {session ? (
            <div className="flex items-center gap-4">
              <button className="text-[brand-navy] scale-95 active:scale-100 transition-transform p-2 rounded-full hover:bg-surface-container-low relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
              </button>

              <Link href="/admin">
                <button className="text-[brand-navy] scale-95 active:scale-100 transition-transform p-2 rounded-full hover:bg-surface-container-low">
                    <Settings className="h-5 w-5" />
                </button>
              </Link>

              <div className="flex items-center gap-4 ml-2">
                <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                    {session.user?.image ? (
                         <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                         <User className="h-4 w-4 text-on-surface-variant" />
                    )}
                </div>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold uppercase tracking-wider">
                    Salir
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold uppercase tracking-wider text-xs">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold uppercase tracking-wider text-xs px-4">Unirse</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
