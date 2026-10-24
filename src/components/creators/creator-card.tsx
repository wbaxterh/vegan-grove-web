import Link from 'next/link';
import { InitialsAvatar } from '@/components/initials-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CreatorFilters, creatorHref } from '@/lib/creators';
import { creatorTopicLabel } from '@/lib/labels';
import type { Creator } from '@/lib/types';

export function CreatorCard({ creator, filters }: { creator: Creator; filters: CreatorFilters }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <InitialsAvatar name={creator.name} />
          <div className="min-w-0">
            <CardTitle className="text-lg">
              <Link href={`/creators/${creator.slug}`} className="hover:underline">
                {creator.name}
              </Link>
            </CardTitle>
            {creator.alsoKnownAs.length > 0 ? (
              <CardDescription className="mt-1">{creator.alsoKnownAs.join(', ')}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{creator.bio}</p>
        {creator.topics.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {creator.topics.map((topic) => (
              <li key={topic}>
                <Link href={creatorHref({ ...filters, topic })}>
                  <Badge variant="outline">{creatorTopicLabel(topic)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
