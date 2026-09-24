"use client";

import { useEffect } from "react";
import { Crest } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <Crest size={44} />
      <h1 className="display mt-8 text-3xl">Algo no salió como esperábamos</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Tuvimos un problema al cargar esta sección. Intenta de nuevo; si el problema continúa, escribe a la coordinación académica.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Referencia: {error.digest}</p>}
      <Button className="mt-8" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
