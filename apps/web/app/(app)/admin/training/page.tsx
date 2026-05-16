import Link from 'next/link';
import { db, trainingSessions, trainingPersonas, users } from '@estateos/db';
import { eq, desc, and, sql as drizzleSql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function AdminTrainingPage() {
  const admin = await requireAdmin();

  // Leaderboard: agent → count + avg score
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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">SPIN-тренажёр</h1>

      <section>
        <h2 className="text-lg font-semibold">Лидерборд</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-neutral-500">
            Пока никто не завершил сессию. Когда агенты потренируются — здесь будет таблица.
          </p>
        ) : (
          <table className="mt-3 w-full overflow-hidden rounded-lg bg-white text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left">Агент</th>
                <th className="px-3 py-2 text-right">Сессий</th>
                <th className="px-3 py-2 text-right">Средний балл</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((l) => (
                <tr key={l.agentId} className="border-t">
                  <td className="px-3 py-2">{l.firstName || l.email}</td>
                  <td className="px-3 py-2 text-right">{l.sessionCount}</td>
                  <td className="px-3 py-2 text-right">{l.avgScore.toFixed(1)}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Последние сессии</h2>
        <ul className="mt-3 space-y-2">
          {recent.map(({ s, a, p }) => (
            <li key={s.id}>
              <Link
                href={`/agent/training/${s.id}` as never}
                className="block rounded-lg border bg-white p-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-neutral-500">
                    {s.status === 'completed'
                      ? `★ ${s.spinAnalysis?.score ?? '—'}/10`
                      : s.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {a.firstName || a.email} · {s.createdAt.toLocaleString('ru-RU')}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
