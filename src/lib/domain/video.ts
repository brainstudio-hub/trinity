export type VideoProvider = "YOUTUBE" | "GOOGLE_DRIVE" | "VIMEO" | "URL";

export type VideoSource = { provider: VideoProvider; id: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function tryUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.split("/")[1] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  const v = url.searchParams.get("v");
  if (v) return YOUTUBE_ID.test(v) ? v : null;

  const [, kind, id] = url.pathname.split("/");
  if (["embed", "shorts", "live", "v"].includes(kind) && id && YOUTUBE_ID.test(id)) return id;
  return null;
}

function driveId(url: URL): string | null {
  if (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com") return null;
  const match = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  return url.searchParams.get("id");
}

function vimeoId(url: URL): string | null {
  if (!url.hostname.endsWith("vimeo.com")) return null;
  const match = url.pathname.match(/\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/** Interpreta el enlace pegado por el administrador y detecta el proveedor. */
export function parseVideoUrl(raw: string): VideoSource | null {
  const input = raw.trim();
  if (!input) return null;
  if (YOUTUBE_ID.test(input)) return { provider: "YOUTUBE", id: input };

  const url = tryUrl(input);
  if (!url || !/^https?:$/.test(url.protocol)) return null;

  const isYoutubeHost = url.hostname === "youtu.be" || YOUTUBE_HOSTS.has(url.hostname);
  if (isYoutubeHost) {
    const id = youtubeId(url);
    return id ? { provider: "YOUTUBE", id } : null;
  }

  const drive = driveId(url);
  if (drive) return { provider: "GOOGLE_DRIVE", id: drive };

  const vimeo = vimeoId(url);
  if (vimeo) return { provider: "VIMEO", id: vimeo };

  return { provider: "URL", id: url.toString() };
}

export function getEmbedUrl(source: VideoSource): string {
  switch (source.provider) {
    case "YOUTUBE":
      return `https://www.youtube-nocookie.com/embed/${source.id}`;
    case "GOOGLE_DRIVE":
      return `https://drive.google.com/file/d/${source.id}/preview`;
    case "VIMEO":
      return `https://player.vimeo.com/video/${source.id}`;
    case "URL":
      return source.id;
  }
}

export function getThumbnailUrl(source: VideoSource): string | null {
  return source.provider === "YOUTUBE" ? `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg` : null;
}

/** Solo estos proveedores exponen la posición de reproducción para notas sincronizadas. */
export function supportsTimeSync(provider: VideoProvider): boolean {
  return provider === "YOUTUBE" || provider === "URL";
}
