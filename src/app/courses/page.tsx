import { db } from "@/lib/db";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book } from "lucide-react";

export default async function CoursesPage() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: { lessons: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Nuestros Cursos</h1>
        <p className="text-muted-foreground">Explora nuestra oferta académica y comienza tu formación hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <div className="aspect-video w-full bg-primary/10 flex items-center justify-center rounded-t-xl">
              <Book className="h-12 w-12 text-primary/40" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {course.description}
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between items-center">
              <span className="text-sm font-medium">{course._count.lessons} Lecciones</span>
              <Link href={`/courses/${course.id}`}>
                <Button>Ver Detalles</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No hay cursos disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}
