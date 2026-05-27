import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CourseEditForm } from "@/components/admin/course-edit-form";

export default async function EditCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-8 pb-10">
      <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al panel
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
           <h2 className="text-xl font-bold mb-4">Detalles del Curso</h2>
           <CourseEditForm course={course} />
        </div>

        <div className="flex-1 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold">Estructura del Curso (Módulos)</h2>
           </div>

           <div className="space-y-4">
             {course.modules.length === 0 && (
               <p className="text-sm text-muted-foreground italic">No hay módulos creados. La gestión de módulos se implementará en el siguiente ticket.</p>
             )}

             {course.modules.map((module) => (
               <div key={module.id} className="border p-4 rounded-lg bg-gray-50">
                 <h3 className="font-bold">{module.title}</h3>
                 <p className="text-sm text-muted-foreground">{module.lessons.length} lecciones</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
