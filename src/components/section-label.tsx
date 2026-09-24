import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Monospace, uppercase, tracked-out label: the one cyberpunk accent used everywhere. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-xs uppercase tracking-[0.2em] text-vg-primary', className)}>
      <span aria-hidden="true">{'// '}</span>
      {children}
    </p>
  );
}
