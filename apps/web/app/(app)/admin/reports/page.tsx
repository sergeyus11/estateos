import Link from 'next/link';
import { db, showReports, users } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function initials(s?: string | null): string {
  if (!s) return '·';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function ReportsPage() {
  const admin = await requireAdmin();
  const rows = await db
    .select({
      r: showReports,
      a: { id: users.id, firstName: users.firstName, email: users.email },
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(eq(showReports.organizationId, admin.organizationId))
    .orderBy(desc(showReports.createdAt))
    .limit(100);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Последние 100</div>
          <h1 className="page-title">Показы</h1>
          <p className="page-subtitle">Все отчёты команды по&nbsp;показам квартир.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Пока пусто</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>
            Когда агенты начнут записывать показы — они появятся здесь.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(({ r, a }) => {
            const final = r.status === 'final';
            return (
              <Link
                key={r.id}
                href={`/admin/reports/${r.id}` as never}
                className="surface-card"
                style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 14, alignItems: 'center', padding: 16, textDecoration: 'none' }}
              >
                <div className="agent-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                  {initials(a.firstName) || initials(a.email)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                      {r.fields?.object || '— объект не указан —'}
                    </span>
                    <span
                      style={{
                        fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 999,
                        background: final ? 'rgba(122,158,107,0.15)' : 'var(--bg-soft)',
                        color: final ? 'var(--success)' : 'var(--ink-3)',
                      }}
                    >
                      {final ? 'финал' : 'черновик'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.fields?.client || '—'} · {r.fields?.budget || '—'} · {r.fields?.reaction || '—'}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>
                    {a.firstName || a.email} · {r.createdAt.toLocaleString('ru-RU')}
                  </div>
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
