"use client";

import { useState, useRef } from "react";
import { VideoPlayer, VideoPlayerRef } from "@/components/video-player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonNotes } from "@/components/lesson-notes";
import {
  PlayCircle,
  ChevronLeft,
  FileText,
  MessageSquare,
  ListTodo,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  HelpCircle,
  StickyNote
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CourseProgressButton } from "@/components/course-progress-button";

interface LessonClientPageProps {
  courseId: string;
  lesson: any;
  course: any;
  userId: string;
  initialNotes: any[];
}

export default function LessonClientPage({
  courseId,
  lesson,
  course,
  userId,
  initialNotes,
}: LessonClientPageProps) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    [lesson.moduleId]: true,
  });
  const [notes, setNotes] = useState(initialNotes);
  const playerRef = useRef<VideoPlayerRef>(null);

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleSeek = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Area: Video and Tabs */}
        <div className="flex-1 w-full space-y-8">
          <div className="space-y-4">
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center text-sm font-body font-medium text-on-surface-variant hover:text-primary transition-colors mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver al Catálogo del Curso
            </Link>

            <VideoPlayer
              ref={playerRef}
              url={lesson.videoUrl}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
              <div className="space-y-1">
                <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
                  {lesson.title}
                </h1>
                <p className="font-body text-on-surface-variant flex items-center gap-2">
                  <span className="font-bold text-primary">{course.title}</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span>{lesson.module.title}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CourseProgressButton
                  lessonId={lesson.id}
                  initialIsCompleted={lesson.userProgress[0]?.isCompleted ?? false}
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="bg-surface-container-low p-1.5 rounded-xl flex h-auto w-fit gap-1 mb-8">
              <TabsTrigger
                value="transcript"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-body font-bold text-sm transition-all border-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                Transcripción
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-body font-bold text-sm transition-all border-none"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                Notas Académicas
                {notes.length > 0 && (
                  <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
                    {notes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="forum"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-body font-bold text-sm transition-all border-none"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Foro
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-body font-bold text-sm transition-all border-none"
              >
                <ListTodo className="h-4 w-4 mr-2" />
                Tareas
              </TabsTrigger>
            </TabsList>

            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-sm min-h-[400px]">
              <TabsContent value="transcript" className="mt-0 focus-visible:ring-0">
                <div className="prose prose-lg max-w-none text-on-surface-variant font-body leading-relaxed">
                  {lesson.transcript ? (
                    <div className="whitespace-pre-wrap">{lesson.transcript}</div>
                  ) : (
                    <div className="text-center py-20">
                       <FileText className="h-12 w-12 text-outline-variant mx-auto mb-4" />
                       <p className="text-on-surface-variant italic">No hay transcripción disponible para esta lección todavía.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 focus-visible:ring-0">
                <LessonNotes
                  lessonId={lesson.id}
                  notes={notes}
                  setNotes={setNotes}
                  getCurrentTime={() => playerRef.current?.getCurrentTime() || 0}
                  onSeek={handleSeek}
                />
              </TabsContent>

              <TabsContent value="forum" className="mt-0 focus-visible:ring-0">
                 <div className="text-center py-20">
                    <MessageSquare className="h-12 w-12 text-outline-variant mx-auto mb-4" />
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Foro Estudiantil</h3>
                    <p className="text-on-surface-variant font-body">El foro para este módulo se activará próximamente.</p>
                 </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-0 focus-visible:ring-0">
                 <div className="text-center py-20">
                    <ListTodo className="h-12 w-12 text-outline-variant mx-auto mb-4" />
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Tareas y Evaluaciones</h3>
                    <p className="text-on-surface-variant font-body">No hay tareas pendientes para esta unidad.</p>
                 </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar Area: Modules and Secondary Sections */}
        <aside className="w-full lg:w-[400px] flex-shrink-0 sticky top-24 space-y-6">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="p-6 border-b bg-surface-container/50">
              <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Contenido del Programa
              </h3>
            </div>

            <div className="divide-y divide-outline-variant/10">
              {course.modules.map((m: any) => (
                <div key={m.id} className="bg-surface-container-low">
                  <button
                    onClick={() => toggleModule(m.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                       <span className="font-headline font-black text-outline-variant group-hover:text-primary transition-colors">
                         {m.order.toString().padStart(2, '0')}
                       </span>
                       <span className="font-headline font-bold text-on-surface text-left text-sm leading-tight">
                         {m.title}
                       </span>
                    </div>
                    {openModules[m.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {openModules[m.id] && (
                    <div className="bg-surface-container-lowest">
                      {m.lessons.map((l: any) => (
                        <Link
                          key={l.id}
                          href={`/courses/${courseId}/lessons/${l.id}`}
                          className={cn(
                            "flex items-center gap-4 px-8 py-4 hover:bg-surface-container transition-all border-l-4",
                            l.id === lesson.id
                              ? "bg-primary/5 border-primary"
                              : "border-transparent"
                          )}
                        >
                          {l.id === lesson.id ? (
                             <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                             <CheckCircle2 className={cn(
                               "h-4 w-4 shrink-0",
                               l.userProgress?.[0]?.isCompleted ? "text-secondary" : "text-outline-variant/50"
                             )} />
                          )}
                          <div className="flex-1">
                             <p className={cn(
                               "font-body text-xs leading-tight mb-1",
                               l.id === lesson.id ? "text-primary font-bold" : "text-on-surface"
                             )}>
                               {l.title}
                             </p>
                             <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                               Video • {Math.floor(l.duration / 60)} min
                             </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Collapsible Sections */}
          <div className="space-y-3">
             <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container transition-colors">
                  <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-primary" />
                    Recursos de Audio
                  </span>
                  <ChevronDown className="h-4 w-4 text-outline-variant" />
                </button>
             </div>

             <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container transition-colors">
                  <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Preguntas Frecuentes
                  </span>
                  <ChevronDown className="h-4 w-4 text-outline-variant" />
                </button>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
