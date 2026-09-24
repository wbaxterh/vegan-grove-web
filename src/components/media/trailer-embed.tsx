'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';

/**
 * Click-to-load trailer. Nothing from YouTube touches the page until the member asks for it,
 * and then only through the no-cookie domain (the only frame-src the CSP allows).
 */
export function TrailerEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm text-muted-foreground transition-colors hover:border-vg-primary hover:text-foreground"
      >
        <Play className="size-8 text-vg-primary" aria-hidden="true" />
        <span>Load the trailer from YouTube (no-cookie embed)</span>
      </button>
    );
  }

  return (
    <iframe
      className="aspect-video w-full rounded-xl border border-border"
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`}
      title={`${title} trailer`}
      allow="encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
