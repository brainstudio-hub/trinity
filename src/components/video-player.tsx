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
  onReady?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ url, onProgress, onReady }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

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

    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl border border-outline-variant/10">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls
          onProgress={onProgress}
          onReady={onReady}
          config={{
            youtube: {
              playerVars: { showinfo: 1 },
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
