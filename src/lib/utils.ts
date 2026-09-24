import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatShortDate = (d: Date | string) => shortDateFmt.format(new Date(d));
export const formatTime = (d: Date | string) => timeFmt.format(new Date(d));

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function formatRelative(d: Date | string): string {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "hace un momento";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d);
}

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}
