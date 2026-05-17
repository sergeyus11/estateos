import { db, showReports, users } from '@estateos/db';
import type { NarrativeStats } from '@estateos/db';
import { eq, and, gte, lt, sql as drizzleSql } from 'drizzle-orm';

const HOT_KEYWORDS = /срочно|готов|купи|хочет|нравится|берём|покупа/i;

export async function collectDayStats(
  organizationId: string,
  forDate: Date
): Promise<NarrativeStats> {
  const dayStart = new Date(forDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [yesterdayReports, todayReports, weekReports] = await Promise.all([
    db.select().from(showReports).where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, dayStart),
        lt(showReports.createdAt, dayEnd)
      )
    ),
    db.select({ c: drizzleSql<number>`count(*)::int` }).from(showReports).where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, todayStart)
      )
    ),
    db.select({ c: drizzleSql<number>`count(*)::int` }).from(showReports).where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, weekStart)
      )
    ),
  ]);

  const byAgent = new Map<string, number>();
  for (const r of yesterdayReports) {
    byAgent.set(r.agentId, (byAgent.get(r.agentId) || 0) + 1);
  }
  let topAgent: NarrativeStats['topAgent'] = null;
  if (byAgent.size > 0) {
    const [topId, topCount] = [...byAgent.entries()].sort((a, b) => b[1] - a[1])[0];
    const [u] = await db.select().from(users).where(eq(users.id, topId)).limit(1);
    topAgent = { name: u?.firstName || u?.email || 'агент', count: topCount };
  }

  const [activeAgentsRow] = await db
    .select({ c: drizzleSql<number>`count(*)::int` })
    .from(users)
    .where(
      and(
        eq(users.organizationId, organizationId),
        eq(users.role, 'agent'),
        eq(users.isActive, true)
      )
    );

  const objectCounts = new Map<string, number>();
  for (const r of yesterdayReports) {
    const obj = r.fields?.object?.trim();
    if (obj) objectCounts.set(obj, (objectCounts.get(obj) || 0) + 1);
  }
  const topObject =
    objectCounts.size > 0
      ? [...objectCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  const hotProspects = yesterdayReports
    .filter((r) => r.fields?.reaction && HOT_KEYWORDS.test(r.fields.reaction))
    .slice(0, 5)
    .map((r) => ({
      object: r.fields?.object || '—',
      client: r.fields?.client || '—',
      reaction: r.fields?.reaction || '',
    }));

  return {
    showsToday: todayReports[0]?.c ?? 0,
    showsYesterday: yesterdayReports.length,
    weekTotal: weekReports[0]?.c ?? 0,
    activeAgents: activeAgentsRow?.c ?? 0,
    topAgent,
    topObject,
    hotProspects,
  };
}
