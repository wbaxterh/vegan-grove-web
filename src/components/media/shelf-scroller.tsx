'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

type ShelfScrollerProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

const NUDGE_CLASS =
  'absolute top-0 bottom-2 hidden w-10 items-center justify-center bg-linear-to-r from-background to-transparent text-foreground opacity-0 transition-opacity group-hover/shelf:opacity-100 focus-visible:opacity-100 focus-visible:outline-none md:flex';

/**
 * The horizontal strip under a shelf heading. The list itself is focusable so arrow keys
 * scroll it; the edge buttons are for mouse users and fade in on hover.
 */
export function ShelfScroller({ label, children, className }: ShelfScrollerProps) {
  const ref = useRef<HTMLUListElement>(null);

  const nudge = (direction: -1 | 1) => {
    const list = ref.current;
    if (!list) return;
    list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudge(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudge(-1);
    }
  };

  return (
    <div className={cn('group/shelf relative', className)}>
      <ul
        ref={ref}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the strip scrolls with the arrow keys once focused
        tabIndex={0}
        aria-label={label}
        onKeyDown={onKeyDown}
        className="-mx-1 flex snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:scroll-auto"
      >
        {children}
      </ul>
      <button
        type="button"
        aria-label={`Scroll ${label} back`}
        onClick={() => nudge(-1)}
        className={cn(NUDGE_CLASS, 'left-0')}
      >
        <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Scroll ${label} forward`}
        onClick={() => nudge(1)}
        className={cn(NUDGE_CLASS, 'right-0 bg-linear-to-l')}
      >
        <ChevronRight className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}
