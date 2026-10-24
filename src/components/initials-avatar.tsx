import { initials } from '@/lib/creators';

/** Initials on the shared tokens. Creators have no portrait in v1, and none is hotlinked. */
export function InitialsAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      data-testid="initials-avatar"
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground"
    >
      {initials(name)}
    </span>
  );
}
