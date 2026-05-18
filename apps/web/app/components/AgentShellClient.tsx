'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { AppShell, AppShellLogoMark, NavIcon, type AppShellNavGroup } from './AppShell';
import { ProfileSheet, type ProfileUser } from './ProfileSheet';
import { FabVoiceModal } from '../(app)/agent/components/FabVoiceModal';

type Tab = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
};

const TABS: Tab[] = [
  {
    href: '/agent',
    label: 'Сегодня',
    short: 'Сегодня',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/agent/clients',
    label: 'Клиенты',
    short: 'Клиенты',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/agent/objects',
    label: 'Объекты',
    short: 'Объекты',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    ),
  },
  { href: '/agent/training', label: 'Тренажёр', short: 'Тренажёр', icon: NavIcon.Training },
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
  const [fabOpen, setFabOpen] = useState(false);

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
          <Link href="/agent" className={'mob-tab' + (path === '/agent' ? ' is-active' : '')}>
            <span className="mob-tab__icon">{TABS[0]!.icon}</span>
            <span className="mob-tab__label">{TABS[0]!.short}</span>
          </Link>
          <Link
            href="/agent/clients"
            className={'mob-tab' + (is('/agent/clients') ? ' is-active' : '')}
          >
            <span className="mob-tab__icon">{TABS[1]!.icon}</span>
            <span className="mob-tab__label">{TABS[1]!.short}</span>
          </Link>
          <button
            type="button"
            className="mob-tab mob-tab--fab"
            style={{
              alignItems: 'center',
              background: '#C8613A',
              border: 'none',
              borderRadius: 23,
              boxShadow: '0 6px 16px rgba(196,131,106,0.45)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0,
              height: 46,
              justifyContent: 'center',
              marginTop: -22,
              width: 46,
            }}
            onClick={() => setFabOpen(true)}
            aria-label="Голосовое событие"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <Link
            href="/agent/objects"
            className={'mob-tab' + (is('/agent/objects') ? ' is-active' : '')}
          >
            <span className="mob-tab__icon">{TABS[2]!.icon}</span>
            <span className="mob-tab__label">{TABS[2]!.short}</span>
          </Link>
          <Link
            href="/agent/training"
            className={'mob-tab' + (is('/agent/training') ? ' is-active' : '')}
          >
            <span className="mob-tab__icon">{TABS[3]!.icon}</span>
            <span className="mob-tab__label">{TABS[3]!.short}</span>
          </Link>
        </nav>

        {fabOpen && (
          <FabVoiceModal onClose={() => setFabOpen(false)} onEventCreated={() => setFabOpen(false)} />
        )}
        <ProfileSheet user={user} open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    </>
  );
}
