import { db, showReports, users } from '@estateos/db';
import { eq, gte, and, sql as drizzleSql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = await requireAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ todayCount }] = await db
    .select({ todayCount: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, todayStart)
      )
    );

  const [{ weekCount }] = await db
    .select({ weekCount: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, weekStart)
      )
    );

  const [{ agentCount }] = await db
    .select({ agentCount: drizzleSql<number>`count(*)::int` })
    .from(users)
    .where(
      and(
        eq(users.organizationId, admin.organizationId),
        eq(users.role, 'agent'),
        eq(users.isActive, true)
      )
    );

  const tiles: { href: string; label: string; hint: string; icon: React.ReactNode }[] = [
    {
      href: '/admin/narrator',
      label: 'Утренний разбор',
      hint: 'Голосовое саммари за вчера',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z" />
        </svg>
      ),
    },
    {
      href: '/admin/analytics',
      label: 'Аналитика',
      hint: '30 дней, конверсия, агенты',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      href: '/admin/reports',
      label: 'Показы',
      hint: 'Все отчёты команды',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      href: '/admin/team',
      label: 'Агенты',
      hint: 'Команда + приглашения',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: '/admin/training',
      label: 'Тренажёр',
      hint: 'SPIN-сессии агентов',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">EstateOS · admin</div>
          <h1 className="page-title">Добро пожаловать.</h1>
          <p className="page-subtitle">Картина агентства за сегодня и неделю.</p>
        </div>
      </div>

      <section className="dash">
        <div className="kpi">
          <div className="kpi__label">Сегодня · показов</div>
          <div className="kpi__value">{todayCount}</div>
          <div className="kpi__delta">за день</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">7 дней · показов</div>
          <div className="kpi__value">{weekCount}</div>
          <div className="kpi__delta">за неделю</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Команда</div>
          <div className="kpi__value">{agentCount}</div>
          <div className="kpi__delta">активных агентов</div>
        </div>
        <div className="kpi" style={{ background: 'linear-gradient(180deg,#FBF8F4,#F2EDE8)' }}>
          <div className="kpi__label">Сейчас</div>
          <div className="kpi__value" style={{ fontSize: 22 }}>
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })}{' '}
            <span className="kpi__value-suffix">МСК</span>
          </div>
          <div className="kpi__delta" style={{ color: 'var(--ink-3)' }}>
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 22 }}>
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href as never}
            className="surface-card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s var(--ease)', textDecoration: 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-50)', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {t.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{t.hint}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </section>
    </div>
  );
}
