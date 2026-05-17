import { db, showReports, users } from '@estateos/db';
import type { NarrativeStats, AgentTrend, TopRisk } from '@estateos/db';
import { eq, and, gte, lt, sql as drizzleSql } from 'drizzle-orm';

const HOT_KEYWORDS = /срочно|готов|купи|хочет|нравится|берём|покупа|то самое/i;
const WARM_KEYWORDS = /подум|посоветуется|альтернатив|сравни|ещё посмотр/i;

/** Парсит fields.budget вида "18 млн", "18 000 000", "18.5М", "18kk" в число рублей */
function parseBudget(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/[\s ]/g, '');
  const wordMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(млн|m|м|кк|kk|млрд|млр)/);
  if (wordMatch) {
    const num = parseFloat(wordMatch[1].replace(',', '.'));
    const unit = wordMatch[2];
    if (unit === 'млрд' || unit === 'млр') return Math.round(num * 1_000_000_000);
    return Math.round(num * 1_000_000);
  }
  const bareMatch = s.match(/(\d{6,12})/);
  if (bareMatch) return parseInt(bareMatch[1], 10);
  return null;
}

function classifyProspect(reaction: string | null | undefined): 'hot' | 'warm' | 'recon' {
  if (!reaction) return 'recon';
  if (HOT_KEYWORDS.test(reaction)) return 'hot';
  if (WARM_KEYWORDS.test(reaction)) return 'warm';
  return 'recon';
}

function classifyAgentState(
  week: number,
  priorWeek: number,
  isOff: boolean
): AgentTrend['state'] {
  if (isOff && week === 0) return 'off';
  if (priorWeek === 0 && week === 0) return 'off';
  if (priorWeek > 0 && week > priorWeek * 1.4) return 'rising';
  if (priorWeek > 0 && week < priorWeek * 0.5) return 'declining';
  return 'stable';
}

export async function collectDayStats(
  organizationId: string,
  forDate: Date
): Promise<NarrativeStats> {
  const dayStart = new Date(forDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const priorDayStart = new Date(dayStart);
  priorDayStart.setDate(priorDayStart.getDate() - 1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const priorWeekStart = new Date(weekStart);
  priorWeekStart.setDate(priorWeekStart.getDate() - 7);

  const [yesterdayReports, priorDayCountRow, todayReports, weekReports, priorWeekReports] =
    await Promise.all([
      db
        .select()
        .from(showReports)
        .where(
          and(
            eq(showReports.organizationId, organizationId),
            gte(showReports.createdAt, dayStart),
            lt(showReports.createdAt, dayEnd)
          )
        ),
      db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(showReports)
        .where(
          and(
            eq(showReports.organizationId, organizationId),
            gte(showReports.createdAt, priorDayStart),
            lt(showReports.createdAt, dayStart)
          )
        ),
      db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(showReports)
        .where(
          and(
            eq(showReports.organizationId, organizationId),
            gte(showReports.createdAt, todayStart)
          )
        ),
      db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(showReports)
        .where(
          and(
            eq(showReports.organizationId, organizationId),
            gte(showReports.createdAt, weekStart)
          )
        ),
      db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(showReports)
        .where(
          and(
            eq(showReports.organizationId, organizationId),
            gte(showReports.createdAt, priorWeekStart),
            lt(showReports.createdAt, weekStart)
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

  // === Owner Narrative additions ===
  const prospectMix = { hot: 0, warm: 0, recon: 0 };
  const budgetsParsed: number[] = [];
  for (const r of yesterdayReports) {
    prospectMix[classifyProspect(r.fields?.reaction)] += 1;
    const b = parseBudget(r.fields?.budget);
    if (b && b >= 1_000_000 && b <= 500_000_000) budgetsParsed.push(b);
  }
  const avgBudget =
    budgetsParsed.length > 0
      ? Math.round(budgetsParsed.reduce((s, x) => s + x, 0) / budgetsParsed.length)
      : undefined;

  const finalReportsYesterday = yesterdayReports.filter((r) => r.status === 'final').length;

  const weekAgentRows = await db
    .select({ id: showReports.agentId, c: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, weekStart)
      )
    )
    .groupBy(showReports.agentId);
  const priorWeekAgentRows = await db
    .select({ id: showReports.agentId, c: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, priorWeekStart),
        lt(showReports.createdAt, weekStart)
      )
    )
    .groupBy(showReports.agentId);

  const weekByAgent = new Map(weekAgentRows.map((r) => [r.id, r.c]));
  const priorWeekByAgent = new Map(priorWeekAgentRows.map((r) => [r.id, r.c]));
  const allAgentIds = new Set([
    ...weekByAgent.keys(),
    ...priorWeekByAgent.keys(),
    ...byAgent.keys(),
  ]);

  const agentTrends: AgentTrend[] = [];
  if (allAgentIds.size > 0) {
    const agentRecords = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, 'agent')
        )
      );
    const agentById = new Map(agentRecords.map((u) => [u.id, u]));

    for (const id of allAgentIds) {
      const u = agentById.get(id);
      if (!u) continue;
      const yest = byAgent.get(id) ?? 0;
      const week = weekByAgent.get(id) ?? 0;
      const priorWeek = priorWeekByAgent.get(id) ?? 0;
      const state = classifyAgentState(week, priorWeek, yest === 0 && week === 0);

      let signal: string | undefined;
      if (state === 'rising' && week > 0) {
        signal = `неделя сильнее предыдущей (${week} vs ${priorWeek} показов)`;
      } else if (state === 'declining' && priorWeek > 0) {
        signal = `спад: ${week} показов против ${priorWeek} на прошлой неделе`;
      } else if (state === 'off') {
        signal = 'без активности — возможно, отгул или отпуск';
      }
      agentTrends.push({
        name: u.firstName || u.email,
        showsYesterday: yest,
        showsWeek: week,
        showsPriorWeek: priorWeek,
        state,
        signal,
      });
    }
    agentTrends.sort((a, b) => {
      if (b.showsYesterday !== a.showsYesterday) return b.showsYesterday - a.showsYesterday;
      if (b.showsWeek !== a.showsWeek) return b.showsWeek - a.showsWeek;
      return a.name.localeCompare(b.name, 'ru');
    });
  }

  const finalsWeekRow = await db
    .select({ c: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, organizationId),
        gte(showReports.createdAt, weekStart),
        eq(showReports.status, 'final')
      )
    );
  const activeReports = weekReports[0]?.c ?? 0;
  const finalsCount = finalsWeekRow[0]?.c ?? 0;
  const pipeline7d = {
    activeReports,
    finalizedShare: activeReports > 0 ? finalsCount / activeReports : 0,
  };

  let topRisk: TopRisk | null = null;
  const coldHot = yesterdayReports.find(
    (r) =>
      r.status !== 'final' &&
      r.fields?.reaction &&
      HOT_KEYWORDS.test(r.fields.reaction)
  );
  if (coldHot) {
    const [agentRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, coldHot.agentId))
      .limit(1);
    const agentName = agentRow?.firstName || agentRow?.email || 'агент';
    const obj = coldHot.fields?.object || 'объект';
    const client = coldHot.fields?.client || 'клиент';
    topRisk = {
      type: 'cold_followup',
      description: `Горячий лид у ${agentName}: ${client} по ${obj} — отчёт не финализирован.`,
      statisticalContext:
        'По нашему опыту, горячие клиенты без follow-up за сутки уходят в 40% случаев.',
      actionDeadline: 'до полудня',
    };
  }

  return {
    showsToday: todayReports[0]?.c ?? 0,
    showsYesterday: yesterdayReports.length,
    weekTotal: weekReports[0]?.c ?? 0,
    activeAgents: activeAgentsRow?.c ?? 0,
    topAgent,
    topObject,
    hotProspects,
    showsPriorDay: priorDayCountRow[0]?.c ?? 0,
    weekPriorTotal: priorWeekReports[0]?.c ?? 0,
    avgBudget,
    finalReportsYesterday,
    prospectMix,
    agentTrends,
    pipeline7d,
    topRisk,
  };
}
