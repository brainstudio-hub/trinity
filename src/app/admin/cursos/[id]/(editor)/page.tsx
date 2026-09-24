import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseInfoForm } from "@/components/admin/course-info-form";
import { getCourseInfo, requireCourseAccess } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Información del curso" };

export default async function CourseInfoPage({ params }: { params: { id: string } }) {
  await requireCourseAccess(params.id);
  const { course, categories, instructors } = await getCourseInfo(params.id);
  if (!course) notFound();

  return (
    <CourseInfoForm
      key={course.updatedAt.toISOString()}
      categories={categories}
      instructors={instructors}
      course={{
        id: course.id,
        title: course.title,
        subtitle: course.subtitle ?? "",
        slug: course.slug,
        code: course.code ?? "",
        description: course.description ?? "",
        coverImageUrl: course.coverImageUrl ?? "",
        trailerUrl: course.trailerUrl ?? "",
        categoryId: course.categoryId ?? "",
        level: course.level,
        language: course.language,
        estimatedHours: course.estimatedHours === null ? "" : String(course.estimatedHours),
        learningOutcomes: course.learningOutcomes,
        requirements: course.requirements,
        instructorIds: course.instructors.map((i) => i.instructorId),
        certificateEnabled: course.certificateEnabled,
        passingScore: String(course.passingScore),
      }}
    />
  );
}
