import type { Metadata } from "next";
import { ResourcesEditor } from "@/components/admin/resources-editor";
import { getCourseResources, requireCourseAccess } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Recursos del curso" };

export default async function CourseResourcesPage({ params }: { params: { id: string } }) {
  await requireCourseAccess(params.id);
  const resources = await getCourseResources(params.id);
  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-[0.9375rem] font-semibold text-tas-navy">Recursos generales del curso</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sílabo, bibliografía, lecturas y materiales que aplican a todo el curso. Los recursos de una lección específica se
          agregan desde el editor de esa lección. Arrastra para cambiar el orden.
        </p>
      </div>
      <ResourcesEditor
        scope={{ courseId: params.id }}
        initial={resources}
        emptyHint="Agrega el sílabo, la bibliografía o lecturas generales del curso."
      />
    </div>
  );
}
