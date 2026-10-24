import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Leaves the site. `noreferrer` drops the Referer; no tracking parameters are added. */
export function OutboundAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'outline' }))}>
      {children}
      <ExternalLink data-icon="inline-end" aria-hidden="true" />
    </a>
  );
}
