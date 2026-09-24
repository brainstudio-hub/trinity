import type { ComponentType } from "react";
import { Cloud, Link2, PlayCircle, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import type { VideoProvider } from "@/lib/domain/video";

const PROVIDER: Record<VideoProvider, { label: string; icon: ComponentType<{ className?: string }>; variant: "accent" | "blue" | "gold" | "muted" }> = {
  YOUTUBE: { label: "YouTube", icon: Youtube, variant: "accent" },
  GOOGLE_DRIVE: { label: "Google Drive", icon: Cloud, variant: "gold" },
  VIMEO: { label: "Vimeo", icon: PlayCircle, variant: "blue" },
  URL: { label: "Archivo / URL", icon: Link2, variant: "muted" },
};

export function VideoProviderBadge({ provider }: { provider: VideoProvider }) {
  const p = PROVIDER[provider];
  const Icon = p.icon;
  return (
    <Badge variant={p.variant} className="normal-case tracking-normal">
      <Icon className="size-3" />
      {p.label}
    </Badge>
  );
}
