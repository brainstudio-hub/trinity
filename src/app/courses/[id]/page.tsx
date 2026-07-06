import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { EnrollButton } from "@/components/enroll-button";
import { VideoPlayer } from "@/components/video-player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, History, Languages, MessageSquare, PlayCircle, Book, User, Clock, Video, Award, ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CoursePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await auth();
  const userId = session?.user?.id;

  const course = await db.course.findUnique({
    where: { id, isPublished: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          }
        }
      },
      enrollments: userId ? {
        where: { userId }
      } : false,
    }
  });

  if (!course) {
    notFound();
  }

  const allLessons = course.modules.flatMap(m => m.lessons);
  const isEnrolled = !!(course.enrollments && course.enrollments.length > 0);
  const introVideoUrl = allLessons[0]?.videoUrl;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative pb-16 pt-4">
      {/* Left Column: Course Content */}
      <div className="lg:col-span-8 space-y-12">
        {/* Hero Section (Bento Style) */}
        <section className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden group border border-outline-variant/10">
          {/* Decorative subtle gradient backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-fixed to-transparent rounded-full blur-3xl opacity-20 -z-0 transform group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
                <BookOpen className="h-3 w-3 text-on-surface-variant" />
                <span className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-wider">{course.category || "Teología"}</span>
              </div>
              <h1 className="font-headline text-3xl md:text-5xl font-semibold text-on-surface tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="font-body text-lg text-on-surface-variant leading-relaxed">
                {course.description || "Un análisis profundo de los principios doctrinales de la Iglesia Anglicana, desde la Reforma Inglesa hasta los Treinta y Nueve Artículos."}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                    <User className="h-6 w-6 text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-body font-semibold text-on-surface">Dr. Thomas Cranmer</p>
                  <p className="font-body text-sm text-on-surface-variant">Decano de Teología Histórica</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs and Content Area */}
        <Tabs defaultValue="info" className="space-y-8">
            <TabsList className="bg-surface-container-low rounded-xl p-2 inline-flex h-auto flex-wrap gap-2 border-none">
                <TabsTrigger value="info" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-brand-navy data-[state=active]:shadow-sm data-[state=inactive]:text-on-surface-variant data-[state=inactive]:hover:bg-surface-container-lowest/50 font-body font-semibold transition-all border-none shadow-none">
                    Información General
                </TabsTrigger>
                <TabsTrigger value="curriculum" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-brand-navy data-[state=active]:shadow-sm data-[state=inactive]:text-on-surface-variant data-[state=inactive]:hover:bg-surface-container-lowest/50 font-body font-semibold transition-all border-none shadow-none">
                    Currículo
                </TabsTrigger>
                <TabsTrigger value="instructor" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-brand-navy data-[state=active]:shadow-sm data-[state=inactive]:text-on-surface-variant data-[state=inactive]:hover:bg-surface-container-lowest/50 font-body font-semibold transition-all border-none shadow-none">
                    Instructor
                </TabsTrigger>
                <TabsTrigger value="reviews" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-brand-navy data-[state=active]:shadow-sm data-[state=inactive]:text-on-surface-variant data-[state=inactive]:hover:bg-surface-container-lowest/50 font-body font-semibold transition-all border-none shadow-none">
                    Reseñas
                </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-8 animate-fade-in mt-0">
                <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6 border border-outline-variant/10">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">Sobre este curso</h2>
                    <div className="prose prose-lg text-on-surface-variant max-w-none font-body leading-relaxed space-y-4">
                        <p>
                            Este curso ofrece una inmersión rigurosa en los documentos fundacionales del anglicanismo. No es un mero recuento histórico, sino una exploración teológica de cómo se forjó la &apos;Vía Media&apos;.
                        </p>
                        <p>
                            A través de la lectura atenta del Libro de Oración Común, los Treinta y Nueve Artículos y las Homilías, los estudiantes desarrollarán una comprensión matizada de la identidad anglicana y su relevancia pastoral en el mundo contemporáneo.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        <div className="bg-surface-container-low p-6 rounded-lg">
                            <h3 className="font-headline text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-brand-navy" />
                                Objetivos de Aprendizaje
                            </h3>
                            <ul className="space-y-3 font-body text-on-surface-variant text-sm">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-secondary" />
                                    Analizar críticamente los textos fundacionales de la Reforma Inglesa.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-secondary" />
                                    Articular la teología sacramental expresada en el Libro de Oración Común.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-secondary" />
                                    Comprender el contexto histórico de los Treinta y Nueve Artículos.
                                </li>
                            </ul>
                        </div>
                        <div className="bg-surface-container-low p-6 rounded-lg">
                            <h3 className="font-headline text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                                <Book className="h-5 w-5 text-brand-navy" />
                                Lecturas Requeridas
                            </h3>
                            <ul className="space-y-3 font-body text-on-surface-variant text-sm">
                                <li className="flex items-start gap-2">
                                    <BookOpen className="h-4 w-4 mt-0.5 text-secondary" />
                                    MacCulloch, Diarmaid. Thomas Cranmer: A Life.
                                </li>
                                <li className="flex items-start gap-2">
                                    <BookOpen className="h-4 w-4 mt-0.5 text-secondary" />
                                    The Book of Common Prayer (1662 Edition).
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="curriculum" className="animate-fade-in mt-0">
                 <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6 border border-outline-variant/10">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">Estructura del Currículo</h2>
                    <div className="space-y-8">
                        {course.modules.map((module) => (
                          <div key={module.id} className="space-y-4">
                            <h3 className="font-headline font-bold text-lg text-brand-navy">{module.title}</h3>
                            <div className="space-y-4">
                              {module.lessons.map((lesson, index) => (
                                  <div key={lesson.id} className="border border-outline-variant/20 rounded-lg p-5 hover:bg-surface-container-low transition-colors group cursor-pointer">
                                      <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-4">
                                              {isEnrolled ? (
                                                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-bold">
                                                      {(index + 1).toString().padStart(2, '0')}
                                                  </div>
                                              ) : (
                                                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-headline font-bold">
                                                      <Lock className="h-4 w-4" />
                                                  </div>
                                              )}
                                              <div>
                                                  <h4 className="font-headline font-bold text-on-surface group-hover:text-brand-navy transition-colors">{lesson.title}</h4>
                                                  <p className="font-body text-sm text-on-surface-variant line-clamp-1">{lesson.description || "Lección del curso"}</p>
                                              </div>
                                          </div>
                                          <ChevronDown className="h-5 w-5 text-outline-variant group-hover:text-brand-navy transition-colors" />
                                      </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                    {allLessons.length > 0 && (
                        <button className="w-full py-3 text-center text-brand-navy font-body font-medium hover:bg-surface-container-low rounded-lg transition-colors">
                            Ver todo el currículo
                        </button>
                    )}
                 </div>
            </TabsContent>

            <TabsContent value="instructor" className="animate-fade-in mt-0">
                <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6 border border-outline-variant/10">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">Sobre el Instructor</h2>
                    <div className="flex items-start gap-6">
                         <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-outline-variant">
                            <User className="h-10 w-10 text-on-surface-variant" />
                        </div>
                        <div className="space-y-2">
                             <h3 className="text-xl font-bold">Dr. Thomas Cranmer</h3>
                             <p className="text-brand-navy font-medium">Decano de Teología Histórica</p>
                             <p className="text-on-surface-variant leading-relaxed">
                                Experto en la Reforma Inglesa y liturgia anglicana, con más de 20 años de experiencia académica y pastoral.
                             </p>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="reviews" className="animate-fade-in mt-0">
                <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6 border border-outline-variant/10 text-center py-12">
                    <MessageSquare className="h-12 w-12 text-surface-variant mx-auto" />
                    <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Aún no hay reseñas</h2>
                    <p className="text-on-surface-variant">Sé el primero en calificar este curso después de completarlo.</p>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Right Column: Sticky Sidebar */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 space-y-6">
            {/* Action Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
                <div className="aspect-video w-full rounded-lg bg-surface-container-high mb-6 overflow-hidden relative group">
                    {introVideoUrl ? (
                         <VideoPlayer url={introVideoUrl} />
                    ) : (
                        <div className="w-full h-full bg-brand-navy/10 flex items-center justify-center">
                            <PlayCircle className="h-16 w-16 text-brand-navy/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button className="w-16 h-16 bg-surface-container-lowest/90 backdrop-blur-md rounded-full flex items-center justify-center text-brand-navy hover:scale-110 transition-transform shadow-lg">
                             <PlayCircle className="h-10 w-10 fill-current" />
                        </button>
                    </div>
                </div>
                <div className="space-y-4 mb-6">
                    <p className="font-headline text-3xl font-semibold text-on-surface">Gratuito</p>
                    <p className="font-body text-sm text-on-surface-variant">Para estudiantes matriculados en el programa de M.Div.</p>
                </div>

                {isEnrolled ? (
                    <Link href={`/courses/${id}/lessons/${allLessons[0]?.id}`} className="w-full">
                        <Button className="w-full py-6 rounded-lg bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold text-lg hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(0,42,88,0.2)]">
                            Continuar Aprendiendo
                        </Button>
                    </Link>
                ) : (
                    <div className="grid">
                         <EnrollButton courseId={id} userId={userId} />
                    </div>
                )}

                <p className="text-center font-body text-xs text-on-surface-variant mt-4">Garantía de acceso de por vida a los materiales.</p>
            </div>

            {/* Meta Data Card */}
            <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-headline text-lg font-bold text-on-surface mb-4">Detalles del Curso</h3>
                <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-brand-navy shadow-sm">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Duración Total</p>
                            <p className="font-body font-semibold text-on-surface">8 Semanas (32 horas)</p>
                        </div>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-brand-navy shadow-sm">
                            <Video className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Lecciones</p>
                            <p className="font-body font-semibold text-on-surface">{allLessons.length} Módulos en video</p>
                        </div>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-brand-navy shadow-sm">
                            <Languages className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Idioma</p>
                            <p className="font-body font-semibold text-on-surface">Español (Subtítulos en Inglés)</p>
                        </div>
                    </li>
                    <li className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-brand-navy shadow-sm">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">Certificación</p>
                            <p className="font-body font-semibold text-on-surface">Certificado de Finalización</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
