"use client";

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import ReactPlayer from "react-player";

export interface VideoPlayerRef {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

interface VideoPlayerProps {
  url: string;
  onProgress?: (state: { playedSeconds: number }) => void;
  onTimeUpdate?: (seconds: number) => void;
  onReady?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ url, onProgress, onTimeUpdate, onReady }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const playerRef = useRef<any>(null);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() || 0;
      },
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, "seconds");
      },
    }));

    if (!isMounted) {
      return (
        <div className="aspect-video bg-surface-container-high animate-pulse rounded-xl" />
      );
    }

    if (hasError) {
      return (
        <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 p-8 text-center">
          <p className="font-headline font-semibold text-slate-500">
            Este video no se puede reproducir o el enlace es inválido.
          </p>
        </div>
      );
    }

    const Player = ReactPlayer as any;

    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl border border-outline-variant/10">
        <Player
          ref={playerRef}
          src={url}
          width="100%"
          height="100%"
          controls
          onError={() => setHasError(true)}
          onProgress={(state: any) => {
            if (onProgress) onProgress(state);
            if (onTimeUpdate) onTimeUpdate(state.playedSeconds);
          }}
          onReady={onReady}
          config={{
            youtube: {
              playerVars: {
                showinfo: 0,
                modestbranding: 1,
                rel: 0
              },
            },
            vimeo: {
              playerOptions: { responsive: true },
            },
          }}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
