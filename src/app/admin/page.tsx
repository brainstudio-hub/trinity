import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const courses = await db.course.findMany({
    include: {
      _count: {
        select: { lessons: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona tus cursos y lecciones.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Publicado" : "Borrador"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.category} • {course._count.lessons} lecciones
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl">
             <p className="text-muted-foreground">No hay cursos creados todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
}
