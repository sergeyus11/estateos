import Link from 'next/link';
import { db, trainingSessions, trainingPersonas, users } from '@estateos/db';
import { eq, desc, and, sql as drizzleSql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const AGENT_GRADIENTS = [
  'linear-gradient(135deg, var(--brand-300), var(--brand-700))',
  'linear-gradient(135deg,#D4A84C,#9A7833)',
  'linear-gradient(135deg,#7A9E6B,#52784A)',
  'linear-gradient(135deg,#6B8EC4,#3E5A8C)',
  'linear-gradient(135deg,#B891C4,#6A4A8C)',
  'linear-gradient(135deg,#C46B82,#7A2E48)',
];

function initials(s?: string | null): string {
  if (!s) return '·';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function AdminTrainingPage() {
  const admin = await requireAdmin();

  const leaderboard = await db
    .select({
      agentId: trainingSessions.agentId,
      firstName: users.firstName,
      email: users.email,
      sessionCount: drizzleSql<number>`count(*)::int`,
      avgScore: drizzleSql<number>`COALESCE(AVG(((spin_analysis->>'score')::numeric)), 0)::float`,
    })
    .from(trainingSessions)
    .innerJoin(users, eq(trainingSessions.agentId, users.id))
    .where(
      and(
        eq(trainingSessions.organizationId, admin.organizationId),
        eq(trainingSessions.status, 'completed')
      )
    )
    .groupBy(trainingSessions.agentId, users.firstName, users.email)
    .orderBy(desc(drizzleSql`COALESCE(AVG(((spin_analysis->>'score')::numeric)), 0)`));

  const recent = await db
    .select({
      s: trainingSessions,
      a: { id: users.id, firstName: users.firstName, email: users.email },
      p: { name: trainingPersonas.name },
    })
    .from(trainingSessions)
    .innerJoin(users, eq(trainingSessions.agentId, users.id))
    .innerJoin(trainingPersonas, eq(trainingSessions.personaId, trainingPersonas.id))
    .where(eq(trainingSessions.organizationId, admin.organizationId))
    .orderBy(desc(trainingSessions.createdAt))
    .limit(30);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">SPIN · 8 типажей</div>
          <h1 className="page-title">Тренажёр</h1>
          <p className="page-subtitle">Лидерборд команды и&nbsp;последние сессии.</p>
        </div>
      </div>

      <section style={{ marginBottom: 28 }}>
        <div className="agents-list">
          <div className="agents-list__head">
            <div className="agents-list__title">Лидерборд</div>
            <span className="agents-list__more">{leaderboard.length} агентов</span>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '12px 0' }}>
              Пока никто не завершил сессию. Когда агенты потренируются — здесь будет таблица.
            </div>
          ) : (
            leaderboard.map((l, i) => (
              <div key={l.agentId} className="agent-row">
                <div className="agent-avatar" style={{ background: AGENT_GRADIENTS[i % AGENT_GRADIENTS.length] }}>
                  {initials(l.firstName) || initials(l.email)}
                </div>
                <div>
                  <div className="agent-row__name">{l.firstName || l.email}</div>
                  <div className="agent-row__role">{l.sessionCount} сессий</div>
                </div>
                <div className="agent-row__score">{l.avgScore.toFixed(1)}/10</div>
                <div className="agent-row__trend">{i === 0 ? '★' : ''}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="page-eyebrow" style={{ marginBottom: 10 }}>Последние сессии</div>
        {recent.length === 0 ? (
          <div className="surface-card" style={{ textAlign: 'center', padding: 28, fontSize: 13, color: 'var(--ink-3)' }}>
            Пока пусто.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map(({ s, a, p }) => {
              const completed = s.status === 'completed';
              const score = s.spinAnalysis?.score;
              return (
                <Link
                  key={s.id}
                  href={`/agent/training/${s.id}` as never}
                  className="surface-card"
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: 14, textDecoration: 'none' }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      {a.firstName || a.email} · {s.createdAt.toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500,
                      padding: '4px 10px', borderRadius: 999,
                      background: completed ? 'var(--brand-50)' : 'var(--bg-soft)',
                      color: completed ? 'var(--brand-700)' : 'var(--ink-3)',
                    }}
                  >
                    {completed && score !== undefined && score !== null ? `★ ${score}/10` : s.status}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
