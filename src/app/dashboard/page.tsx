import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          _count: {
            select: { lessons: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Mis Cursos</h1>
        <p className="text-muted-foreground">Continúa donde lo dejaste.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enr) => (
          <Card key={enr.course.id} className="flex flex-col">
            <div className="aspect-video w-full bg-primary/10 flex items-center justify-center rounded-t-xl">
              <Book className="h-12 w-12 text-primary/40" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{enr.course.category}</Badge>
                <Badge variant="outline">{enr.course.level}</Badge>
              </div>
              <CardTitle className="line-clamp-2">{enr.course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {enr.course.description}
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between items-center">
              <span className="text-sm font-medium">{enr.course._count.lessons} Lecciones</span>
              <Link href={`/courses/${enr.course.id}`}>
                <Button>Continuar</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {enrollments.length === 0 && (
        <div className="text-center py-20 bg-white border rounded-2xl">
          <p className="text-muted-foreground mb-4">Aún no te has inscrito en ningún curso.</p>
          <Link href="/courses">
            <Button>Explorar Catálogo</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
