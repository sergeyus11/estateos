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
};

const TABS: Tab[] = [
  { href: '/agent', label: 'Показы', short: 'Показы', icon: NavIcon.Mic },
  { href: '/agent/training', label: 'SPIN-тренажёр', short: 'Тренажёр', icon: NavIcon.Training },
];

function initialsOf(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export function AgentShellClient({ user, children }: { user: ProfileUser; children: ReactNode }) {
  const path = usePathname() ?? '';
  const is = (prefix: string) => path === prefix || path.startsWith(prefix + '/');
  const [profileOpen, setProfileOpen] = useState(false);

  const desktopGroups: AppShellNavGroup[] = [
    {
      label: 'Мой день',
      items: TABS.map((t) => ({
        href: t.href,
        label: t.label,
        icon: t.icon,
        active: t.href === '/agent' ? path === '/agent' : is(t.href),
      })),
    },
  ];

  const initials = initialsOf(user.name || user.email);

  return (
    <>
      <div className="admin-shell-desktop">
        <AppShell brand="EstateOS" groups={desktopGroups}>{children}</AppShell>
      </div>

      <div className="admin-shell-mobile">
        <header className="mob-topbar">
          <Link href={'/agent' as never} className="mob-topbar__brand" aria-label="EstateOS">
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
            const active = t.href === '/agent' ? path === '/agent' : is(t.href);
            return (
              <Link
                key={t.href}
                href={t.href as never}
                className={'mob-tab' + (active ? ' is-active' : '')}
              >
                <span className="mob-tab__icon">{t.icon}</span>
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
