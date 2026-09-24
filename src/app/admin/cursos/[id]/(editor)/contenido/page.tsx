import type { Metadata } from "next";
import { CurriculumEditor } from "@/components/admin/curriculum-editor";
import { getCurriculum, requireCourseAccess } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Currículo del curso" };

export default async function CurriculumPage({ params }: { params: { id: string } }) {
  await requireCourseAccess(params.id);
  const modules = await getCurriculum(params.id);
  return (
    <CurriculumEditor
      courseId={params.id}
      initialModules={modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationSeconds: l.durationSeconds,
          isPublished: l.isPublished,
          isFreePreview: l.isFreePreview,
          hasVideo: !!l.videoProvider,
          questionCount: l.quiz?._count.questions ?? null,
        })),
      }))}
    />
  );
}
