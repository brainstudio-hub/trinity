import { describe, expect, it } from "vitest";
import { parseVideoUrl, getEmbedUrl, getThumbnailUrl } from "./video";

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reconoce YouTube: %s", (url, id) => {
    expect(parseVideoUrl(url)).toEqual({ provider: "YOUTUBE", id });
  });

  it("acepta un ID de YouTube suelto", () => {
    expect(parseVideoUrl("dQw4w9WgXcQ")).toEqual({ provider: "YOUTUBE", id: "dQw4w9WgXcQ" });
  });

  it.each([
    ["https://drive.google.com/file/d/1AbC_dEf-123/view?usp=sharing", "1AbC_dEf-123"],
    ["https://drive.google.com/file/d/1AbC_dEf-123/preview", "1AbC_dEf-123"],
    ["https://drive.google.com/open?id=1AbC_dEf-123", "1AbC_dEf-123"],
    ["https://drive.google.com/uc?id=1AbC_dEf-123&export=download", "1AbC_dEf-123"],
  ])("reconoce Google Drive: %s", (url, id) => {
    expect(parseVideoUrl(url)).toEqual({ provider: "GOOGLE_DRIVE", id });
  });

  it("reconoce Vimeo", () => {
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({ provider: "VIMEO", id: "76979871" });
    expect(parseVideoUrl("https://player.vimeo.com/video/76979871")).toEqual({ provider: "VIMEO", id: "76979871" });
  });

  it("devuelve URL genérica para enlaces http desconocidos", () => {
    expect(parseVideoUrl("https://cdn.example.com/clase.mp4")).toEqual({
      provider: "URL",
      id: "https://cdn.example.com/clase.mp4",
    });
  });

  it("devuelve null para entradas inválidas", () => {
    expect(parseVideoUrl("")).toBeNull();
    expect(parseVideoUrl("   ")).toBeNull();
    expect(parseVideoUrl("no es un link")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/watch?v=")).toBeNull();
  });
});

describe("getEmbedUrl", () => {
  it("genera embeds por proveedor", () => {
    expect(getEmbedUrl({ provider: "YOUTUBE", id: "abc" })).toBe("https://www.youtube-nocookie.com/embed/abc");
    expect(getEmbedUrl({ provider: "GOOGLE_DRIVE", id: "xyz" })).toBe("https://drive.google.com/file/d/xyz/preview");
    expect(getEmbedUrl({ provider: "VIMEO", id: "1" })).toBe("https://player.vimeo.com/video/1");
    expect(getEmbedUrl({ provider: "URL", id: "https://a.b/c.mp4" })).toBe("https://a.b/c.mp4");
  });
});

describe("getThumbnailUrl", () => {
  it("usa la miniatura de YouTube", () => {
    expect(getThumbnailUrl({ provider: "YOUTUBE", id: "abc" })).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
  });
  it("es null para otros proveedores", () => {
    expect(getThumbnailUrl({ provider: "GOOGLE_DRIVE", id: "x" })).toBeNull();
  });
});
