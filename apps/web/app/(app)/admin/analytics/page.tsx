import Link from 'next/link';
import { db, showReports, users } from '@estateos/db';
import { eq, and, gte, sql as drizzleSql, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { TrendChart, type TrendPoint } from './TrendChart';

export const dynamic = 'force-dynamic';

function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default async function AnalyticsPage() {
  const admin = await requireAdmin();
  const days30 = lastNDays(30);
  const since = days30[0];

  const rows = await db
    .select({
      day: drizzleSql<string>`to_char(${showReports.createdAt} AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD')`,
      total: drizzleSql<number>`count(*)::int`,
      finals: drizzleSql<number>`sum(case when ${showReports.status} = 'final' then 1 else 0 end)::int`,
    })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, since)
      )
    )
    .groupBy(drizzleSql`to_char(${showReports.createdAt} AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.day, r]));
  const totalSeries: TrendPoint[] = days30.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return { label: key.slice(5), value: byDay.get(key)?.total ?? 0 };
  });
  const finalsSeries: TrendPoint[] = days30.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return { label: key.slice(5), value: byDay.get(key)?.finals ?? 0 };
  });

  const totalAll = totalSeries.reduce((s, p) => s + p.value, 0);
  const totalFinals = finalsSeries.reduce((s, p) => s + p.value, 0);
  const conversionPct = totalAll > 0 ? Math.round((totalFinals / totalAll) * 100) : 0;

  const weekStart = lastNDays(7)[0];
  const perAgent = await db
    .select({
      agentId: showReports.agentId,
      firstName: users.firstName,
      email: users.email,
      total: drizzleSql<number>`count(*)::int`,
      finals: drizzleSql<number>`sum(case when ${showReports.status} = 'final' then 1 else 0 end)::int`,
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, weekStart)
      )
    )
    .groupBy(showReports.agentId, users.firstName, users.email)
    .orderBy(desc(drizzleSql`count(*)`));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <p className="text-sm text-neutral-500">За 30 дней. Часовой пояс — Москва.</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Показов 30д" value={totalAll} />
        <Stat label="Финализированных" value={totalFinals} />
        <Stat label="Конверсия в финал" value={`${conversionPct}%`} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <TrendChart data={totalSeries} title="Показы по дням" />
        <TrendChart data={finalsSeries} title="Финализированные по дням" />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Команда (7 дней)</h2>
        {perAgent.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">пока пусто</p>
        ) : (
          <table className="mt-3 w-full overflow-hidden rounded-lg bg-white text-sm">
            <thead className="bg-neutral-100 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Агент</th>
                <th className="px-3 py-2 text-right">Показов</th>
                <th className="px-3 py-2 text-right">Финал</th>
                <th className="px-3 py-2 text-right">Конверсия</th>
              </tr>
            </thead>
            <tbody>
              {perAgent.map((r) => (
                <tr key={r.agentId} className="border-t">
                  <td className="px-3 py-2">{r.firstName || r.email}</td>
                  <td className="px-3 py-2 text-right">{r.total}</td>
                  <td className="px-3 py-2 text-right">{r.finals}</td>
                  <td className="px-3 py-2 text-right">
                    {r.total > 0 ? Math.round((r.finals / r.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Link href={'/admin' as never} className="inline-block text-sm text-brand-500 underline">
        ← дашборд
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="text-xs uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}
