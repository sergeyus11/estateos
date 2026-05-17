import Link from 'next/link';
import type { ReactNode } from 'react';

export type AppShellNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
  active?: boolean;
};

export type AppShellNavGroup = {
  label?: string;
  items: AppShellNavItem[];
};

export function AppShellLogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="app-lg-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D89A82" />
          <stop offset="55%" stopColor="#C4836A" />
          <stop offset="100%" stopColor="#9A6048" />
        </linearGradient>
        <linearGradient id="app-lg-hi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#app-lg-fill)" />
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#app-lg-hi)" />
      <g fill="#FFFDF9">
        <rect x="6" y="13" width="2.6" height="6" rx="1.3" />
        <rect x="10.5" y="10" width="2.6" height="12" rx="1.3" />
        <rect x="15" y="7" width="2.6" height="18" rx="1.3" />
        <rect x="19.5" y="11" width="2.6" height="10" rx="1.3" />
        <rect x="24" y="14" width="2.6" height="4" rx="1.3" />
      </g>
    </svg>
  );
}

export function AppShell({
  brand,
  groups,
  signOutHref = '/api/auth/sign-out',
  children,
}: {
  brand?: string;
  groups: AppShellNavGroup[];
  signOutHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="app-shell__side">
        <div className="app-shell__brand">
          <AppShellLogoMark size={26} />
          <span className="app-shell__brand-text">{brand ?? 'EstateOS'}</span>
        </div>

        {groups.map((g, gi) => (
          <div key={gi} style={{ display: 'contents' }}>
            {g.label && <div className="app-shell__nav-label">{g.label}</div>}
            {g.items.map((item) => (
              <Link
                key={item.href}
                href={item.href as never}
                className={'app-shell__nav-item' + (item.active ? ' is-active' : '')}
              >
                {item.icon}
                {item.label}
                {item.badge && <span className="app-shell__nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}

        <a className="app-shell__nav-item app-shell__sign-out" href={signOutHref}>
          Выйти
        </a>
      </aside>

      <main className="app-shell__main">{children}</main>
    </div>
  );
}

/* ----------------------- nav icons (reusable) ---------------------- */

export const NavIcon = {
  Dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Narrator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z" />
    </svg>
  ),
  Analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Team: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Training: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  ),
};
