"use client";

import { useEffect, useState } from "react";

export function VideoPlayer({ url }: { url: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return <div className="aspect-video bg-slate-200 animate-pulse rounded-xl" />;

  // Basic parser for YouTube/Vimeo
  let embedUrl = url;
  if (url.includes("youtube.com/watch?v=")) {
    embedUrl = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
  } else if (url.includes("vimeo.com/")) {
    const vimeoId = url.split("/").pop();
    embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
