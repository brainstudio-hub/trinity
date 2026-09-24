import Link from "next/link";
import { Crest } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Crest size={48} />
      <p className="eyebrow mt-8">Error 404</p>
      <h1 className="display mt-3 text-4xl">No encontramos esta página</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Es posible que el enlace haya cambiado o que el contenido ya no esté disponible.</p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/inicio">Ir a mi aprendizaje</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cursos">Ver catálogo</Link>
        </Button>
      </div>
    </div>
  );
}
