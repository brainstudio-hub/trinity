import { db } from "@/lib/db";
import { Search, Clock, BarChart3, Book, User } from "lucide-react";
import Link from "next/link";

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
    <div className="pt-4 md:pt-8 pb-20">
      {/* Page Header */}
      <div className="mb-12">
        <h2 className="font-headline text-[2.5rem] md:text-[3.5rem] text-on-surface font-black tracking-tight leading-none mb-4">Catálogo de Cursos</h2>
        <p className="font-body text-lg text-on-surface-variant max-w-2xl leading-relaxed">Explore nuestra colección curada de estudios teológicos, históricos y pastorales, diseñados para formar líderes con profundidad académica y rigor espiritual.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-surface-container-low rounded-xl p-6 sticky top-24">
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                <input
                    type="text"
                    placeholder="Buscar cursos..."
                    className="w-full bg-surface-container-lowest border-none rounded-md py-3 pl-10 pr-4 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-headline font-bold text-on-surface mb-4 uppercase tracking-widest text-xs">Categorías</h3>
                <ul className="space-y-3 font-body text-sm text-on-surface-variant">
                  {['Doctrina', 'Historia', 'Práctica Pastoral'].map((cat) => (
                    <li key={cat}>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border border-outline-variant bg-surface-container-lowest group-hover:border-primary transition-colors">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="absolute opacity-0 peer-checked:opacity-100 text-primary transition-opacity">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="group-hover:text-primary transition-colors">{cat}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-headline font-bold text-on-surface mb-4 uppercase tracking-widest text-xs">Nivel</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label text-sm font-medium transition-colors">Introductorio</button>
                  <button className="px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant font-label text-sm hover:bg-surface-container transition-colors">Intermedio</button>
                  <button className="px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant font-label text-sm hover:bg-surface-container transition-colors">Avanzado</button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Course Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
                <article className="group bg-surface-container-lowest rounded-xl overflow-hidden cursor-pointer flex flex-col h-full transform transition-transform hover:-translate-y-1 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all">
                <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Book className="h-12 w-12 text-primary/20" />
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                    <span className="px-2 py-1 rounded bg-white/20 backdrop-blur-md text-white font-label text-xs font-semibold">
                        {course.category || "Teología"}
                    </span>
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label text-xs mb-3">
                    <Clock className="h-4 w-4" />
                    <span>8 Semanas</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant mx-1"></span>
                    <BarChart3 className="h-4 w-4" />
                    <span>{course.level === 'BASICO' ? 'Introductorio' : course.level === 'INTERMEDIO' ? 'Intermedio' : 'Avanzado'}</span>
                    </div>

                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                    </h3>
                    <p className="font-body text-on-surface-variant text-sm line-clamp-2 mb-6">
                        {course.description}
                    </p>

                    <div className="mt-auto pt-4 flex items-center gap-3 border-t border-surface-container-highest">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                         <User className="h-5 w-5 text-on-surface-variant" />
                    </div>
                    <div className="font-label text-xs">
                        <p className="text-on-surface font-semibold">Dr. Thomas Cranmer</p>
                        <p className="text-on-surface-variant">Profesor de Teología Sistemática</p>
                    </div>
                    </div>
                </div>
                </article>
            </Link>
          ))}

          {courses.length === 0 && (
            <div className="col-span-full text-center py-20 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/50">
              <p className="text-on-surface-variant">No hay cursos disponibles en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
