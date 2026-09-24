'use client';

import { Bot, MessageSquare, Rss, Settings, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/app/feed', label: 'Feed', icon: Rss },
  { href: '/app/messages', label: 'Messages', icon: MessageSquare },
  { href: '/app/friends', label: 'Friends', icon: UserPlus },
  { href: '/app/companion', label: 'Companion', icon: Bot },
  { href: '/app/settings', label: 'Settings', icon: Settings },
] as const;

export function AppNav({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App"
      className={cn(orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex gap-1')}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              active
                ? 'bg-sidebar-accent font-medium text-vg-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              orientation === 'horizontal' && 'px-2 py-1.5',
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={cn(orientation === 'horizontal' && 'sr-only sm:not-sr-only')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
