'use client';

import { useEffect } from 'react';

export type ProfileUser = {
  name: string;
  email: string;
  orgName?: string | null;
  role?: string | null;
};

function initialsOf(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export function ProfileSheet({
  user,
  open,
  onClose,
}: {
  user: ProfileUser;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  return (
    <div className={'profile-sheet' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="profile-sheet__backdrop" onClick={onClose} />
      <div className="profile-sheet__panel" role="dialog" aria-label="Профиль">
        <div className="profile-sheet__handle" />
        <header className="profile-sheet__head">
          <div className="profile-sheet__avatar">{initialsOf(user.name || user.email)}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="profile-sheet__name">{user.name || user.email}</div>
            <div className="profile-sheet__email">{user.email}</div>
            {user.orgName && <div className="profile-sheet__org">{user.orgName}{user.role ? ` · ${user.role}` : ''}</div>}
          </div>
          <button className="profile-sheet__close" onClick={onClose} aria-label="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <nav className="profile-sheet__list">
          <a href="/admin/voices" className="profile-sheet__item" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z"/>
            </svg>
            <span>Голос утреннего разбора</span>
            <svg className="profile-sheet__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
          <a href="/admin/training" className="profile-sheet__item" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <span>SPIN-тренажёр</span>
            <svg className="profile-sheet__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
          <a href="mailto:hi@estateos.ru" className="profile-sheet__item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Помощь и связь</span>
            <svg className="profile-sheet__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </nav>

        <div className="profile-sheet__footer">
          <a href="/api/auth/sign-out" className="profile-sheet__signout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Выйти из EstateOS
          </a>
          <div className="profile-sheet__version">EstateOS</div>
        </div>
      </div>
    </div>
  );
}
