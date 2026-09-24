import type { ReactNode } from 'react';
import { SectionLabel } from '@/components/section-label';
import { cn } from '@/lib/utils';

type ScreenProps = {
  /** Short mono label above the title, e.g. "Places". */
  label?: ReactNode;
  title: ReactNode;
  /** Context: what this screen is, one or two sentences. */
  context?: ReactNode;
  /** Action: the primary things a member can do here (buttons, forms, the map). */
  action?: ReactNode;
  /** Support: what helps them do it (legend, tips, related links). Renders as an aside. */
  support?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * Every screen follows Context, Action, Support (SOUL.md): what is this, what can I do,
 * what helps me do it. Pages fill the slots; this keeps the hierarchy identical everywhere.
 */
export function Screen({
  label,
  title,
  context,
  action,
  support,
  children,
  className,
}: ScreenProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8', className)}>
      <header data-slot="screen-context" className="max-w-3xl">
        {label ? <SectionLabel className="mb-3">{label}</SectionLabel> : null}
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {context ? (
          <div className="mt-3 text-base leading-relaxed text-muted-foreground">{context}</div>
        ) : null}
      </header>

      <div
        className={cn(
          'mt-8 grid gap-8',
          support ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'grid-cols-1',
        )}
      >
        <div className="min-w-0 space-y-8">
          {action ? <section data-slot="screen-action">{action}</section> : null}
          {children}
        </div>
        {support ? (
          <aside
            data-slot="screen-support"
            className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 text-sm lg:sticky lg:top-24"
          >
            {support}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
