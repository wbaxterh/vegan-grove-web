import type { LucideIcon } from 'lucide-react';
import { Unplug } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? <Icon className="mb-4 size-8 text-vg-primary" aria-hidden="true" /> : null}
      <p className="font-heading text-lg font-medium">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** The honest state for a public page when the API cannot be reached. */
export function ApiUnavailable({ what }: { what: string }) {
  return (
    <EmptyState
      icon={Unplug}
      title={`${what} are unavailable right now`}
      description="The API did not answer. Nothing is cached about you; try again in a moment."
    />
  );
}
