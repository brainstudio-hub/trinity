import { ChevronRight, Mail, Globe, FileText, Star, Church, Clock, ArrowRight, User, Book } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InstructorProfilePage({ params }: { params: { id: string } }) {
  // Empty state for professor profile
  const instructor = {
    name: "Perfil No Encontrado",
    title: "Facultad del Seminario",
    department: "Seminario Anglicano Trinity",
    stats: {
      courses: 0,
      students: "0",
      rating: 0
    },
    bio: [
      "Estamos actualizando los perfiles de nuestra facultad. Por favor, vuelve más tarde para conocer más sobre nuestros instructores y decanos."
    ],
    courses: [] as any[]
  };

  return (
    <div className="max-w-7xl mx-auto w-full pt-4 pb-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-on-surface-variant mb-12 font-medium">
        <Link href="/courses" className="hover:text-brand-navy transition-colors">Faculty</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-on-surface">{instructor.name}</span>
      </nav>

      {/* Instructor Profile Header (Asymmetric Layout) */}
      <section className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-20 items-start">
        <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0">
          <div className="absolute inset-0 bg-surface-container-low rounded-2xl transform -rotate-3 z-0"></div>
          <div className="w-full h-full bg-surface-container-high rounded-2xl shadow-[0_12px_40px_rgba(0,42,88,0.08)] relative z-10 overflow-hidden border border-outline-variant/10 flex items-center justify-center">
             <User className="h-24 w-24 text-on-surface-variant/40" />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-brand-navy text-on-primary rounded-full p-3 shadow-lg z-20 flex items-center justify-center" title="Tenured Professor">
            <Star className="h-6 w-6 fill-current" />
          </div>
        </div>

        <div className="flex-1 pt-4">
          <div className="inline-flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 font-headline">
            <Church className="h-4 w-4" />
            {instructor.department}
          </div>
          <h2 className="font-headline text-3xl md:text-[3.5rem] leading-tight font-semibold text-on-surface tracking-tight mb-2">{instructor.name}</h2>
          <p className="text-xl text-brand-navy font-medium mb-6 font-headline tracking-wide">{instructor.title}</p>

          <div className="flex gap-4 mb-8">
            <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-brand-navy transition-all shadow-sm border border-outline-variant/10">
              <Mail className="h-5 w-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-brand-navy transition-all shadow-sm border border-outline-variant/10">
              <Globe className="h-5 w-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-brand-navy transition-all shadow-sm border border-outline-variant/10">
              <FileText className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Bento */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
            <div>
              <div className="text-3xl font-headline font-bold text-on-surface mb-1">{instructor.stats.courses}</div>
              <div className="text-sm text-on-surface-variant font-medium">Courses Taught</div>
            </div>
            <div>
              <div className="text-3xl font-headline font-bold text-on-surface mb-1">{instructor.stats.students}</div>
              <div className="text-sm text-on-surface-variant font-medium">Students Mentored</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-3xl font-headline font-bold text-on-surface">{instructor.stats.rating}</span>
                <Star className="h-6 w-6 text-tertiary-fixed-dim fill-current" />
              </div>
              <div className="text-sm text-on-surface-variant font-medium">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Biography */}
      <section className="mb-24">
        <h3 className="font-headline text-2xl font-bold text-on-surface mb-8 border-b-2 border-surface-container-highest pb-4 inline-block">Academic Biography</h3>
        <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/10 text-on-surface-variant leading-relaxed text-lg space-y-6">
          {instructor.bio.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Courses Grid (Bento Style) */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Courses Impartidos</h3>
          <Link href="/courses" className="text-brand-navy font-medium hover:underline text-sm flex items-center gap-1">
            View Full Syllabus <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {instructor.courses.map((course) => (
            <article key={course.id} className="bg-surface-container-lowest rounded-xl overflow-hidden group cursor-pointer flex flex-col h-full transform transition-all hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,42,88,0.08)] border border-outline-variant/10">
              <div className="h-48 bg-surface-container-low relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                {course.image ? (
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full bg-brand-navy/10 flex items-center justify-center">
                        <Book className="h-12 w-12 text-brand-navy/20" />
                    </div>
                )}
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-brand-navy/90 backdrop-blur-sm text-on-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider font-headline">
                    {course.badge}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h4 className="font-headline text-xl font-bold text-on-surface mb-2 group-hover:text-brand-navy transition-colors">{course.title}</h4>
                <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">{course.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-container">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </div>
                  <span className="text-brand-navy font-medium text-sm">Enroll</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
