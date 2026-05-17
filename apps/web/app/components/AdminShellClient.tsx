'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell, NavIcon, type AppShellNavGroup } from './AppShell';

export function AdminShellClient({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  const is = (prefix: string) => path === prefix || path.startsWith(prefix + '/');

  const groups: AppShellNavGroup[] = [
    {
      label: 'Управление',
      items: [
        { href: '/admin', label: 'Дашборд', icon: NavIcon.Dashboard, active: path === '/admin' },
        { href: '/admin/narrator', label: 'Утренний разбор', icon: NavIcon.Narrator, badge: 'NEW', active: is('/admin/narrator') },
        { href: '/admin/analytics', label: 'Аналитика', icon: NavIcon.Analytics, active: is('/admin/analytics') },
        { href: '/admin/team', label: 'Агенты', icon: NavIcon.Team, active: is('/admin/team') },
        { href: '/admin/reports', label: 'Показы', icon: NavIcon.Reports, active: is('/admin/reports') },
        { href: '/admin/training', label: 'Тренажёр', icon: NavIcon.Training, active: is('/admin/training') },
      ],
    },
  ];

  return <AppShell brand="EstateOS" groups={groups}>{children}</AppShell>;
}
