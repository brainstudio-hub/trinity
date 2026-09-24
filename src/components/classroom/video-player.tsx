"use client";

import * as React from "react";
import { toast } from "sonner";
import { Film } from "lucide-react";
import { saveProgressAction } from "@/lib/actions/learning";
import { formatTimestamp } from "@/lib/domain/format";
import { getEmbedUrl, type VideoSource } from "@/lib/domain/video";
import { usePlayer } from "./player-context";

// ── API de YouTube (carga única) ───────────────────────────────
type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(s: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
};
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

const SAVE_EVERY_MS = 15_000;

/** Acumula segundos realmente reproducidos y envía el progreso al servidor. */
function useProgressReporter(lessonId: string, enrolled: boolean, initialWatched: number, onCompleted: () => void) {
  const watched = React.useRef(initialWatched);
  const lastTick = React.useRef<number | null>(null);
  const lastSent = React.useRef(0);
  const completed = React.useRef(false);

  const tick = React.useCallback((position: number, playing: boolean) => {
    if (playing && lastTick.current !== null) {
      const delta = position - lastTick.current;
      // Solo cuenta avances normales (no saltos ni retrocesos)
      if (delta > 0 && delta <= 2.5) watched.current += delta;
    }
    lastTick.current = playing ? position : null;
  }, []);

  const flush = React.useCallback(
    async (position: number, duration: number) => {
      if (!enrolled) return;
      lastSent.current = Date.now();
      const res = await saveProgressAction({
        lessonId,
        positionSeconds: Math.max(0, position),
        watchedSeconds: Math.round(watched.current),
        durationSeconds: duration > 0 ? Math.round(duration) : undefined,
      });
      if (res.ok && res.data?.completed && !completed.current) {
        completed.current = true;
        onCompleted();
      }
    },
    [enrolled, lessonId, onCompleted]
  );

  const maybeFlush = React.useCallback(
    (position: number, duration: number) => {
      if (Date.now() - lastSent.current > SAVE_EVERY_MS) void flush(position, duration);
    },
    [flush]
  );

  return { tick, flush, maybeFlush };
}

export function VideoPlayer({
  lessonId,
  source,
  startAt,
  initialWatched,
  alreadyCompleted,
  enrolled,
  onCompleted,
}: {
  lessonId: string;
  source: VideoSource | null;
  startAt: number;
  initialWatched: number;
  alreadyCompleted: boolean;
  enrolled: boolean;
  onCompleted: () => void;
}) {
  if (!source) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-tas-navy-deep text-center text-tas-cream/80">
        <Film className="size-10 text-tas-cream/30" strokeWidth={1.4} />
        <p className="font-serif text-2xl text-tas-cream">El video de esta sesión estará disponible pronto</p>
        <p className="max-w-md px-6 text-sm text-tas-cream/60">
          Mientras tanto, estudia el bosquejo de la sesión y avanza en la guía de estudio.
        </p>
      </div>
    );
  }
  if (source.provider === "YOUTUBE") {
    return (
      <YouTubePlayer
        key={lessonId}
        lessonId={lessonId}
        videoId={source.id}
        startAt={alreadyCompleted ? 0 : startAt}
        initialWatched={initialWatched}
        enrolled={enrolled}
        onCompleted={onCompleted}
      />
    );
  }
  if (source.provider === "URL") {
    return (
      <FilePlayer
        key={lessonId}
        lessonId={lessonId}
        src={source.id}
        startAt={alreadyCompleted ? 0 : startAt}
        initialWatched={initialWatched}
        enrolled={enrolled}
        onCompleted={onCompleted}
      />
    );
  }
  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        src={getEmbedUrl(source)}
        title="Video de la lección"
        className="size-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

function YouTubePlayer({
  lessonId,
  videoId,
  startAt,
  initialWatched,
  enrolled,
  onCompleted,
}: {
  lessonId: string;
  videoId: string;
  startAt: number;
  initialWatched: number;
  enrolled: boolean;
  onCompleted: () => void;
}) {
  const container = React.useRef<HTMLDivElement>(null);
  const player = React.useRef<YTPlayer | null>(null);
  const { register, setCurrentTime } = usePlayer();
  const reporter = useProgressReporter(lessonId, enrolled, initialWatched, onCompleted);

  React.useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    loadYouTubeApi().then(() => {
      if (cancelled || !container.current || !window.YT) return;
      const host = document.createElement("div");
      container.current.appendChild(host);
      player.current = new window.YT.Player(host, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, start: Math.floor(startAt), playsinline: 1, cc_lang_pref: "es", hl: "es" },
        events: {
          onReady: () => {
            register({
              getCurrentTime: () => player.current?.getCurrentTime() ?? 0,
              seekTo: (s) => player.current?.seekTo(s, true),
              pause: () => player.current?.pauseVideo(),
              play: () => player.current?.playVideo(),
            });
            if (startAt > 5) toast(`Retomando en ${formatTimestamp(startAt)}`, { duration: 2500 });
          },
          onStateChange: (e: { data: number }) => {
            const p = player.current;
            if (!p) return;
            // 2 = pausado, 0 = terminado
            if (e.data === 2 || e.data === 0) void reporter.flush(p.getCurrentTime(), p.getDuration());
          },
        },
      });

      interval = setInterval(() => {
        const p = player.current;
        if (!p?.getCurrentTime) return;
        const t = p.getCurrentTime();
        const playing = p.getPlayerState?.() === 1;
        setCurrentTime(t);
        reporter.tick(t, playing);
        if (playing) reporter.maybeFlush(t, p.getDuration());
      }, 1000);
    });

    const onHide = () => {
      const p = player.current;
      if (p?.getCurrentTime && document.visibilityState === "hidden") void reporter.flush(p.getCurrentTime(), p.getDuration());
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      const p = player.current;
      if (p?.getCurrentTime) void reporter.flush(p.getCurrentTime(), p.getDuration());
      register(null);
      p?.destroy();
      player.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return <div ref={container} className="aspect-video w-full bg-black [&>iframe]:size-full [&>div]:size-full" />;
}

function FilePlayer({
  lessonId,
  src,
  startAt,
  initialWatched,
  enrolled,
  onCompleted,
}: {
  lessonId: string;
  src: string;
  startAt: number;
  initialWatched: number;
  enrolled: boolean;
  onCompleted: () => void;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const { register, setCurrentTime } = usePlayer();
  const reporter = useProgressReporter(lessonId, enrolled, initialWatched, onCompleted);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    register({
      getCurrentTime: () => v.currentTime,
      seekTo: (s) => (v.currentTime = s),
      pause: () => v.pause(),
      play: () => void v.play(),
    });
    return () => {
      void reporter.flush(v.currentTime, v.duration || 0);
      register(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      controls
      playsInline
      className="aspect-video w-full bg-black"
      onLoadedMetadata={(e) => {
        if (startAt > 0) e.currentTarget.currentTime = startAt;
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        setCurrentTime(v.currentTime);
        reporter.tick(v.currentTime, !v.paused);
        if (!v.paused) reporter.maybeFlush(v.currentTime, v.duration || 0);
      }}
      onPause={(e) => void reporter.flush(e.currentTarget.currentTime, e.currentTarget.duration || 0)}
      onEnded={(e) => void reporter.flush(e.currentTarget.currentTime, e.currentTarget.duration || 0)}
    />
  );
}
