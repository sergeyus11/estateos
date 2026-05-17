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

function sparkPoints(values: number[], width = 100, height = 38): string {
  if (values.length === 0) return '';
  const max = Math.max(1, ...values);
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const AGENT_GRADIENTS = [
  'linear-gradient(135deg, var(--brand-300), var(--brand-700))',
  'linear-gradient(135deg,#D4A84C,#9A7833)',
  'linear-gradient(135deg,#7A9E6B,#52784A)',
  'linear-gradient(135deg,#6B8EC4,#3E5A8C)',
  'linear-gradient(135deg,#B891C4,#6A4A8C)',
  'linear-gradient(135deg,#C46B82,#7A2E48)',
];

function initials(name?: string | null): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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

  const last7 = totalSeries.slice(-7).reduce((s, p) => s + p.value, 0);
  const prev7 = totalSeries.slice(-14, -7).reduce((s, p) => s + p.value, 0);
  const trend7Pct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

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
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">30 дней · Москва</div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Показы, конверсия, агенты — за месяц.</p>
        </div>
      </div>

      <section className="dash">
        <div className="kpi">
          <div className="kpi__label">Показов · 30д</div>
          <div className="kpi__value">{totalAll}</div>
          <div className={'kpi__delta' + (trend7Pct < 0 ? ' kpi__delta--down' : '')}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points={trend7Pct < 0 ? '6 9 12 15 18 9' : '6 15 12 9 18 15'} />
            </svg>
            {trend7Pct >= 0 ? '+' : ''}{trend7Pct}% к&nbsp;прошлой нед.
          </div>
          <svg className="kpi__spark" viewBox="0 0 100 38" preserveAspectRatio="none">
            <polyline points={sparkPoints(totalSeries.map((p) => p.value))} stroke="#C4836A" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="kpi">
          <div className="kpi__label">Финализированных</div>
          <div className="kpi__value">{totalFinals}</div>
          <div className="kpi__delta">{totalAll > 0 ? `${Math.round((totalFinals / totalAll) * 100)}% от всех` : '—'}</div>
          <svg className="kpi__spark" viewBox="0 0 100 38" preserveAspectRatio="none">
            <polyline points={sparkPoints(finalsSeries.map((p) => p.value))} stroke="#7A9E6B" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="kpi">
          <div className="kpi__label">Конверсия в финал</div>
          <div className="kpi__value">{conversionPct}<span className="kpi__value-suffix">%</span></div>
          <div className="kpi__delta">за 30 дней</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Команда (7д)</div>
          <div className="kpi__value">{perAgent.length}</div>
          <div className="kpi__delta">активных агентов</div>
        </div>
      </section>

      <section className="dash-grid">
        <div className="chart">
          <div className="chart__head">
            <div className="chart__title">Показы и&nbsp;финал · 30 дней</div>
            <div className="chart__legend">
              <span className="chart__legend-item">Показы</span>
              <span className="chart__legend-item chart__legend-item--alt">Финал</span>
            </div>
          </div>
          <TrendChart data={totalSeries} title="" series2={finalsSeries} />
        </div>

        <div className="agents-list">
          <div className="agents-list__head">
            <div className="agents-list__title">Топ агентов · 7 дней</div>
            <span className="agents-list__more">{perAgent.length} всего</span>
          </div>
          {perAgent.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '12px 0' }}>пока пусто</div>
          ) : (
            perAgent.slice(0, 6).map((r, i) => {
              const conv = r.total > 0 ? Math.round((r.finals / r.total) * 100) : 0;
              const name = r.firstName || r.email;
              return (
                <div key={r.agentId} className="agent-row">
                  <div className="agent-avatar" style={{ background: AGENT_GRADIENTS[i % AGENT_GRADIENTS.length] }}>{initials(r.firstName) || initials(r.email)}</div>
                  <div>
                    <div className="agent-row__name">{name}</div>
                    <div className="agent-row__role">{r.total} показов · {r.finals} финал</div>
                  </div>
                  <div className="agent-row__score">{conv}%</div>
                  <div className="agent-row__trend">{i === 0 ? '★' : ''}</div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
