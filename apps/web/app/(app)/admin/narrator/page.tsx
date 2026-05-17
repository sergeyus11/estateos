import Link from 'next/link';
import { db, morningNarratives } from '@estateos/db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
}

export default async function NarratorListPage() {
  const admin = await requireAdmin();
  const rows = await db
    .select()
    .from(morningNarratives)
    .where(
      and(
        eq(morningNarratives.organizationId, admin.organizationId),
        eq(morningNarratives.adminId, admin.id)
      )
    )
    .orderBy(desc(morningNarratives.createdAt))
    .limit(30);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">9:30 МСК · каждый день</div>
          <h1 className="page-title">Утренний разбор</h1>
          <p className="page-subtitle">Голосовое саммари вчерашнего дня. Без планёрок.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--brand-50)', color: 'var(--brand-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>Первый разбор придёт завтра в 09:30 МСК</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>Как только в системе появится первый показ, утренний разбор сгенерируется автоматически.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => {
            const ready = r.status === 'ready';
            const stats = (r.stats ?? {}) as { showsYesterday?: number; activeAgents?: number };
            return (
              <Link
                key={r.id}
                href={`/admin/narrator/${r.id}` as never}
                className="surface-card"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: 18, textDecoration: 'none' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ready ? (r.listenedAt ? 'var(--ink-3)' : 'var(--brand-500)') : r.status === 'error' ? 'var(--error)' : 'var(--warning)', boxShadow: ready && !r.listenedAt ? '0 0 0 3px rgba(196,131,106,0.18)' : undefined }} />
                    <span className="page-eyebrow">{ready ? (r.listenedAt ? 'прослушан' : 'новый') : r.status}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{formatDate(r.periodDate)}</div>
                  {stats.showsYesterday !== undefined && (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-3)' }}>
                      {stats.showsYesterday} показов · команда {stats.activeAgents ?? 0}
                    </div>
                  )}
                  {r.status === 'error' && r.errorMessage && (
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-red-700)' }}>{r.errorMessage.slice(0, 80)}</div>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
