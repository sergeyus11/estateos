import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, users, showReports, agentSettings, reminderLog } from '@estateos/db';
import { eq, and, gte } from 'drizzle-orm';
import { sendPushToUser } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const agents = await db
    .select()
    .from(users)
    .where(and(eq(users.role, 'agent'), eq(users.isActive, true)));

  let sentCount = 0;
  let skippedDayOff = 0;
  let skippedAlreadyReported = 0;
  let skippedAlreadyReminded = 0;

  for (const u of agents) {
    // Day-off check
    const [s] = await db
      .select()
      .from(agentSettings)
      .where(eq(agentSettings.userId, u.id))
      .limit(1);
    if (s?.dayOffDate === todayStr) {
      skippedDayOff++;
      continue;
    }

    // Already reported today?
    const [todayReport] = await db
      .select()
      .from(showReports)
      .where(and(eq(showReports.agentId, u.id), gte(showReports.createdAt, today)))
      .limit(1);
    if (todayReport) {
      skippedAlreadyReported++;
      continue;
    }

    // Already reminded today?
    const [alreadySent] = await db
      .select()
      .from(reminderLog)
      .where(
        and(eq(reminderLog.agentId, u.id), eq(reminderLog.forDate, todayStr))
      )
      .limit(1);
    if (alreadySent) {
      skippedAlreadyReminded++;
      continue;
    }

    const sent = await sendPushToUser(u.id, {
      title: 'Не забудь записать показы',
      body: 'Расскажи голосом, что было сегодня — это займёт минуту.',
      url: '/agent',
    });

    await db.insert(reminderLog).values({
      id: nanoid(16),
      agentId: u.id,
      forDate: todayStr,
      channel: sent ? 'push' : 'none',
    });
    if (sent) sentCount++;
  }

  return NextResponse.json({
    ok: true,
    agentsChecked: agents.length,
    sentCount,
    skippedDayOff,
    skippedAlreadyReported,
    skippedAlreadyReminded,
  });
}
