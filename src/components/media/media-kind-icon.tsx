import { Clapperboard, Film, type LucideIcon, Mic, Tv, Zap } from 'lucide-react';
import type { MediaKind } from '@/lib/types';

/** One glyph per kind, shared by the generated poster, the cards, and the filter pills. */
export const MEDIA_KIND_ICONS: Record<MediaKind, LucideIcon> = {
  documentary: Clapperboard,
  film: Film,
  series: Tv,
  talk: Mic,
  short: Zap,
};

export function MediaKindIcon({ kind, className }: { kind: MediaKind; className?: string }) {
  const Icon = MEDIA_KIND_ICONS[kind];
  return <Icon className={className} aria-hidden="true" />;
}
