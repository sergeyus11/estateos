'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { AppShell, AppShellLogoMark, NavIcon, type AppShellNavGroup } from './AppShell';
import { ProfileSheet, type ProfileUser } from './ProfileSheet';

type Tab = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
  badge?: string;
};

const TABS: Tab[] = [
  { href: '/admin', label: 'Дашборд', short: 'Дашборд', icon: NavIcon.Dashboard },
  { href: '/admin/narrator', label: 'Утренний разбор', short: 'Разбор', icon: NavIcon.Narrator, badge: 'NEW' },
  { href: '/admin/analytics', label: 'Аналитика', short: 'Анализ', icon: NavIcon.Analytics },
  { href: '/admin/team', label: 'Агенты', short: 'Агенты', icon: NavIcon.Team },
  { href: '/admin/reports', label: 'Показы', short: 'Показы', icon: NavIcon.Reports },
];

function initialsOf(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export function AdminShellClient({ user, children }: { user: ProfileUser; children: ReactNode }) {
  const path = usePathname() ?? '';
  const is = (prefix: string) => path === prefix || path.startsWith(prefix + '/');
  const [profileOpen, setProfileOpen] = useState(false);

  // Desktop sidebar (≥901px) — то же что было раньше
  const desktopGroups: AppShellNavGroup[] = [
    {
      label: 'Управление',
      items: [
        ...TABS.map((t) => ({
          href: t.href,
          label: t.label,
          icon: t.icon,
          badge: t.badge,
          active: t.href === '/admin' ? path === '/admin' : is(t.href),
        })),
        { href: '/admin/training', label: 'Тренажёр', icon: NavIcon.Training, active: is('/admin/training') },
      ],
    },
  ];

  const initials = initialsOf(user.name || user.email);

  return (
    <>
      {/* Desktop layout ≥901px — sidebar */}
      <div className="admin-shell-desktop">
        <AppShell brand="EstateOS" groups={desktopGroups}>{children}</AppShell>
      </div>

      {/* Mobile layout ≤900px — top bar + bottom tabs */}
      <div className="admin-shell-mobile">
        <header className="mob-topbar">
          <Link href={'/admin' as never} className="mob-topbar__brand" aria-label="EstateOS — дашборд">
            <AppShellLogoMark size={28} />
            <span className="mob-topbar__brand-text">EstateOS</span>
          </Link>
          <button
            type="button"
            className="mob-topbar__avatar"
            onClick={() => setProfileOpen(true)}
            aria-label="Открыть профиль"
          >
            {initials}
          </button>
        </header>

        <main className="mob-main">{children}</main>

        <nav className="mob-tabbar" aria-label="Главная навигация">
          {TABS.map((t) => {
            const active = t.href === '/admin' ? path === '/admin' : is(t.href);
            return (
              <Link
                key={t.href}
                href={t.href as never}
                className={'mob-tab' + (active ? ' is-active' : '')}
              >
                <span className="mob-tab__icon">
                  {t.icon}
                  {t.badge && <span className="mob-tab__badge">{t.badge}</span>}
                </span>
                <span className="mob-tab__label">{t.short}</span>
              </Link>
            );
          })}
        </nav>

        <ProfileSheet user={user} open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    </>
  );
}
