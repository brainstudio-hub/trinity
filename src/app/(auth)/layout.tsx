import { Crest, Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Panel institucional */}
      <aside className="relative hidden overflow-hidden bg-tas-navy-deep text-tas-cream lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #F2AF00 0, transparent 40%), radial-gradient(circle at 80% 90%, #CD1543 0, transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 size-[520px] -translate-y-1/2 rounded-full border border-tas-cream/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 top-1/2 size-[360px] -translate-y-1/2 rounded-full border border-tas-cream/[0.06]"
        />

        <Logo inverse className="relative" />

        <div className="relative max-w-md">
          <Crest size={56} className="mb-10 opacity-95" />
          <blockquote className="font-serif text-[2rem] leading-[1.25] text-tas-cream">
            «Lámpara es a mis pies tu palabra, y lumbrera a mi camino».
          </blockquote>
          <p className="mt-4 text-sm tracking-wide text-tas-cream/60">Salmo 119:105</p>
        </div>

        <div className="relative flex items-end justify-between gap-8 border-t border-tas-cream/10 pt-6 text-xs text-tas-cream/60">
          <p className="max-w-[16rem] leading-relaxed">Formando líderes anglicanos para la misión en el mundo hispanohablante.</p>
          <p className="shrink-0 font-semibold uppercase tracking-[0.16em]">Campus virtual</p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-screen flex-col bg-background px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Seminario Anglicano Trinity · Ambridge, Pensilvania
        </p>
      </main>
    </div>
  );
}
