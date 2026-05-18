import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { agendaEvents, clients, db, objects } from '@estateos/db';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { TodayHome } from './TodayHome';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mskDayBounds() {
  const now = new Date();
  const mskOffset = 3 * 60 * 60 * 1000;
  const mskNow = new Date(now.getTime() + mskOffset);
  const mskStart = new Date(
    Date.UTC(mskNow.getUTCFullYear(), mskNow.getUTCMonth(), mskNow.getUTCDate()) - mskOffset
  );
  const mskEnd = new Date(mskStart.getTime() + 24 * 60 * 60 * 1000);
  return { now, mskStart, mskEnd };
}

export default async function AgentPage() {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    if (e instanceof Response) throw e;
    return null;
  }

  const { now, mskStart, mskEnd } = mskDayBounds();

  const events = await db
    .select({
      e: agendaEvents,
      clientName: clients.name,
      objectTitle: objects.title,
    })
    .from(agendaEvents)
    .leftJoin(clients, eq(agendaEvents.clientId, clients.id))
    .leftJoin(objects, eq(agendaEvents.objectId, objects.id))
    .where(
      and(
        eq(agendaEvents.agentId, user.id),
        gte(agendaEvents.scheduledAt, mskStart),
        lt(agendaEvents.scheduledAt, mskEnd)
      )
    )
    .orderBy(asc(agendaEvents.scheduledAt));

  return <TodayHome events={events} nowIso={now.toISOString()} />;
}
