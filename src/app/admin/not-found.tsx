import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function AdminNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="No encontramos esta página"
      description="Es posible que el elemento se haya eliminado o que no tengas permisos para verlo."
      action={
        <Button asChild variant="outline">
          <Link href="/admin">Ir al resumen</Link>
        </Button>
      }
      className="mt-10"
    />
  );
}
