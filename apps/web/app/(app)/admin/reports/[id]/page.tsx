import Link from 'next/link';
import { db, showReports, users } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [row] = await db
    .select({
      r: showReports,
      a: { id: users.id, firstName: users.firstName, email: users.email },
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(
      and(eq(showReports.id, id), eq(showReports.organizationId, admin.organizationId))
    )
    .limit(1);

  if (!row) notFound();

  const fields = row.r.fields ?? {};
  const final = row.r.status === 'final';

  return (
    <div>
      <div className="page-head narrator-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={'/admin/reports' as never} className="narrator-head__back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Показы
          </Link>
          <h1 className="page-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fields.object || '— объект не указан —'}</h1>
          <p className="page-subtitle">
            {row.a.firstName || row.a.email} · {row.r.createdAt.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {' · '}
            <span style={{ color: final ? 'var(--success)' : 'var(--ink-3)' }}>
              {final ? '✓ финал' : 'черновик'}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card__label">Клиент</div>
          <div style={{ fontSize: 16, color: 'var(--ink)', marginTop: 4 }}>{fields.client || '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Бюджет</div>
          <div style={{ fontSize: 16, color: 'var(--ink)', marginTop: 4 }}>{fields.budget || '—'}</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-card__label">Реакция</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>{fields.reaction || '—'}</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-card__label">Следующий шаг</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>{fields.nextStep || '—'}</div>
        </div>
      </div>

      {row.r.voiceUrl && (
        <div className="surface-card" style={{ marginBottom: 18 }}>
          <div className="page-eyebrow">Запись</div>
          <audio src={row.r.voiceUrl} controls style={{ width: '100%', marginTop: 8 }} />
        </div>
      )}

      {row.r.transcript && (
        <details className="surface-card" style={{ marginBottom: 18 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Расшифровка</summary>
          <p style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{row.r.transcript}</p>
        </details>
      )}

      {row.r.rounds && row.r.rounds.length > 0 && (
        <details className="surface-card" style={{ background: 'var(--color-amber-50)' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Раунды уточнения ({row.r.rounds.length})
          </summary>
          <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 0, listStyle: 'none' }}>
            {row.r.rounds.map((rd, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--ink)' }}>Q:</strong> {rd.question || '—'}
                <br />
                <strong style={{ color: 'var(--ink)' }}>A:</strong> {rd.answer || '—'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
