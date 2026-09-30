import { Badge } from '@/components/ui/badge';
import { ACCESS_LABELS } from '@/lib/media-library';
import type { WatchAccess } from '@/lib/types';

/** "Free" is the badge that matters, so it is the only filled one. */
export function AccessBadge({ access }: { access: WatchAccess }) {
  return (
    <Badge variant={access === 'free' ? 'default' : 'outline'} data-access={access}>
      {ACCESS_LABELS[access]}
    </Badge>
  );
}
