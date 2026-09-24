export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** 65 → "1:05", 3725 → "1:02:05" */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** "1:05" → 65; "90" → 90; inválido → null */
export function parseTimestamp(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d+$/.test(v)) return Number(v);
  const parts = v.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n > 59)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

/** Duración legible: "1 h 30 min", "10 min" */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 min";
  const minutes = Math.ceil(totalSeconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const HONORIFICS = new Set(["rev", "dr", "dra", "pbro", "mons", "sr", "sra", "lic", "prof"]);

export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/\./g, ""))
    .filter((w) => w && !HONORIFICS.has(w.toLowerCase()));
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
