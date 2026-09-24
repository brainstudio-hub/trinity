"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Algo salió mal"
      description="No pudimos cargar esta sección. Revisa tu conexión e intenta de nuevo; si el problema continúa, avisa al equipo técnico."
      action={
        <Button onClick={reset} variant="outline">
          <RotateCcw /> Reintentar
        </Button>
      }
      className="mt-10"
    />
  );
}
