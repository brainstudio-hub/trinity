import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CourseEditForm } from "@/components/admin/course-edit-form";
import { CourseBuilder } from "@/components/admin/course-builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ListTree } from "lucide-react";

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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Panel Administrativo
        </Link>
      </div>

      <div className="space-y-2">
         <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
           {course.title}
         </h1>
         <p className="text-on-surface-variant font-body">ID del Curso: {course.id}</p>
      </div>

      <Tabs defaultValue="builder" className="w-full space-y-8">
        <TabsList className="bg-surface-container-low p-1 rounded-xl w-fit">
          <TabsTrigger value="builder" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <ListTree className="h-4 w-4 mr-2" />
            Constructor Visual
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0 focus-visible:ring-0 animate-fade-in">
          <CourseBuilder courseId={course.id} initialModules={course.modules} />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 focus-visible:ring-0 animate-fade-in">
           <div className="max-w-2xl bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
              <h2 className="font-headline text-xl font-bold mb-6">Detalles Básicos del Curso</h2>
              <CourseEditForm course={course} />
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
