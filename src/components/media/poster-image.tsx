'use client';

import Image from 'next/image';
import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

type PosterImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Rendered in place of the image when it fails to load, so a dead CDN URL never shows a broken tile. */
  fallback: ReactNode;
  className?: string;
};

/** A CDN image that swaps to its generated stand-in on error. Fills its positioned parent. */
export function PosterImage({ src, alt, sizes, priority, fallback, className }: PosterImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
