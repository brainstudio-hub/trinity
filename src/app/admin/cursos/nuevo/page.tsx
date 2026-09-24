import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { AdminBreadcrumbs } from "@/components/admin/admin-shell";
import { NewCourseForm } from "@/components/admin/new-course-form";
import { getCategoryOptions, requireStaff } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Nuevo curso" };

export default async function NewCoursePage() {
  await requireStaff();
  const categories = await getCategoryOptions();
  return (
    <div className="mx-auto max-w-2xl">
      <AdminBreadcrumbs items={[{ label: "Cursos", href: "/admin/cursos" }, { label: "Nuevo curso" }]} />
      <PageHeader
        eyebrow="Cursos"
        title="Nuevo curso"
        description="Empieza con lo esencial. El curso se crea como borrador y podrás completar la descripción, el currículo y los docentes en el editor."
      />
      <NewCourseForm categories={categories} />
    </div>
  );
}
