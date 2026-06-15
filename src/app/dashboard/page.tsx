import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PlayCircle, ArrowRight, MoreHorizontal, Megaphone } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="pb-20 pt-4">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-headline font-extrabold text-on-surface leading-tight mb-2">Bienvenido, {session.user.name?.split(' ')[0]}</h1>
        <p className="text-on-surface-variant font-body text-lg">Tu progreso académico en el seminario.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left/Center Column (Activity & Courses) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Activity Summary (Bento Grid) */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <h3 className="text-on-surface-variant font-body text-sm font-medium z-10">Courses Completed</h3>
              <div className="flex items-end gap-2 z-10">
                <span className="text-4xl font-headline font-bold text-on-surface">12</span>
                <span className="text-on-surface-variant text-sm mb-1">total</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <h3 className="text-on-surface-variant font-body text-sm font-medium z-10">Hours Studied</h3>
              <div className="flex items-end gap-2 z-10">
                <span className="text-4xl font-headline font-bold text-on-surface">148</span>
                <span className="text-on-surface-variant text-sm mb-1">hrs</span>
              </div>
            </div>
            <div className="bg-primary text-on-primary p-6 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              <h3 className="font-body text-sm font-medium z-10 opacity-90">Current GPA</h3>
              <div className="flex items-end gap-2 z-10">
                <span className="text-4xl font-headline font-bold">3.9</span>
                <span className="text-sm mb-1 opacity-90">/ 4.0</span>
              </div>
            </div>
          </section>

          {/* Continue Learning */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-[1.75rem] font-headline font-bold text-on-surface">Continue Learning</h2>
              <Link href="/courses" className="text-primary font-body text-sm font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {enrollments.length > 0 ? enrollments.map((enr, index) => {
                const lessonCount = enr.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                return (
                  <div key={enr.course.id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:-translate-y-1 transition-all duration-300">
                      <div className="w-20 h-20 rounded-lg bg-surface-container flex-shrink-0 overflow-hidden relative border border-outline-variant/10">
                      {enr.course.image ? (
                          <img src={enr.course.image} alt={enr.course.title} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">{enr.course.title[0]}</span>
                          </div>
                      )}
                      </div>
                      <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                          <span className="text-xs font-headline font-bold text-primary uppercase tracking-widest mb-1 block">{enr.course.category || 'COURSE'} {300 + index}</span>
                          <h3 className="text-lg font-headline font-bold text-on-surface leading-tight">{enr.course.title}</h3>
                          </div>
                      </div>
                      <p className="text-on-surface-variant font-body text-sm mb-4">{lessonCount} lecciones disponibles</p>
                      <div className="flex items-center gap-4 w-full">
                          <div className="flex-1 h-[4px] bg-secondary-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[65%] rounded-full"></div>
                          </div>
                          <span className="text-xs font-body font-medium text-on-surface-variant w-10 text-right">65%</span>
                      </div>
                      </div>
                      <Link href={`/courses/${enr.course.id}`}>
                          <button className="mt-4 sm:mt-0 w-full sm:w-auto bg-surface-container-low text-primary hover:bg-surface-container p-3 rounded-xl transition-colors flex items-center justify-center">
                              <PlayCircle className="h-6 w-6 fill-current" />
                          </button>
                      </Link>
                  </div>
                );
              }) : (
                <div className="bg-surface-container-lowest p-12 rounded-xl shadow-sm border border-outline-variant/10 text-center">
                    <p className="text-on-surface-variant mb-6">Aún no te has inscrito en ningún curso.</p>
                    <Link href="/courses">
                        <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                            Explorar Catálogo
                        </button>
                    </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="flex flex-col gap-8">
          {/* Calendar / Upcoming */}
          <section className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-headline font-bold text-on-surface">Upcoming</h2>
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {/* Event 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center justify-center bg-surface-container-lowest w-14 h-14 rounded-lg shadow-sm border border-outline-variant/5 flex-shrink-0">
                  <span className="text-xs font-body font-bold text-error uppercase">Oct</span>
                  <span className="text-lg font-headline font-bold text-on-surface">12</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface text-sm mb-1">Live Seminar: The Trinity</h4>
                  <p className="font-body text-xs text-on-surface-variant mb-1">10:00 AM - 11:30 AM</p>
                  <span className="inline-block px-2 py-1 bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Live Class</span>
                </div>
              </div>
              {/* Event 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center justify-center bg-surface-container-lowest w-14 h-14 rounded-lg shadow-sm border border-outline-variant/5 flex-shrink-0">
                  <span className="text-xs font-body font-bold text-error uppercase">Oct</span>
                  <span className="text-lg font-headline font-bold text-on-surface">15</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface text-sm mb-1">Essay: Patristic Exegesis</h4>
                  <p className="font-body text-xs text-on-surface-variant mb-1">Due by 11:59 PM</p>
                  <span className="inline-block px-2 py-1 bg-error-container text-on-error-container text-[10px] font-bold rounded-md uppercase tracking-wider">Assignment</span>
                </div>
              </div>
              {/* Event 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center justify-center bg-surface-container-lowest w-14 h-14 rounded-lg shadow-sm border border-outline-variant/5 flex-shrink-0 opacity-70">
                  <span className="text-xs font-body font-bold text-on-surface-variant uppercase">Oct</span>
                  <span className="text-lg font-headline font-bold text-on-surface">18</span>
                </div>
                <div className="opacity-70">
                  <h4 className="font-headline font-bold text-on-surface text-sm mb-1">Chapel Service</h4>
                  <p className="font-body text-xs text-on-surface-variant mb-1">8:00 AM - St. Jude&apos;s</p>
                  <span className="inline-block px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Event</span>
                </div>
              </div>
            </div>
          </section>

          {/* Seminary Announcements */}
          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-headline font-bold text-on-surface">Seminary News</h2>
            </div>
            <div className="flex flex-col gap-5">
              <article className="group cursor-pointer">
                <span className="text-xs font-body text-on-surface-variant mb-1 block">Just now</span>
                <h4 className="font-headline font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors">Guest Lecture: Dr. Rowan Williams on Contemporary Ethics</h4>
              </article>
              <div className="h-px w-full bg-surface-variant"></div>
              <article className="group cursor-pointer">
                <span className="text-xs font-body text-on-surface-variant mb-1 block">Yesterday</span>
                <h4 className="font-headline font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors">Library Hours Extended for Midterm Reading Week</h4>
              </article>
              <div className="h-px w-full bg-surface-variant"></div>
              <Link href="#" className="text-primary font-body text-sm font-medium hover:underline text-center mt-2 block">
                Read all announcements
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
