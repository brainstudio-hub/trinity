import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CourseEditForm } from "@/components/admin/course-edit-form";
import { LessonCreateForm } from "@/components/admin/lesson-create-form";
import { LessonList } from "@/components/admin/lesson-list";

export default async function EditCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
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
             <h2 className="text-xl font-bold">Lecciones</h2>
           </div>

           <div className="space-y-4">
             <LessonList lessons={course.lessons} courseId={id} />

             <div className="pt-4">
                <h3 className="text-lg font-bold mb-4 border-t pt-4">Añadir Lección</h3>
                <LessonCreateForm courseId={id} nextOrder={course.lessons.length + 1} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
