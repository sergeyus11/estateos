'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell, NavIcon, type AppShellNavGroup } from './AppShell';

export function AgentShellClient({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  const is = (prefix: string) => path === prefix || path.startsWith(prefix + '/');

  const groups: AppShellNavGroup[] = [
    {
      label: 'Мой день',
      items: [
        { href: '/agent', label: 'Показы', icon: NavIcon.Mic, active: path === '/agent' },
        { href: '/agent/training', label: 'SPIN-тренажёр', icon: NavIcon.Training, active: is('/agent/training') },
      ],
    },
  ];

  return <AppShell brand="EstateOS" groups={groups}>{children}</AppShell>;
}
