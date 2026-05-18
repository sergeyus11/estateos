import { and, asc, eq, gte, lt, ne } from 'drizzle-orm';
import { agendaEvents, clients, db, morningNarratives, objects } from '@estateos/db';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { mskDayBounds } from '@/lib/time';
import { TodayHome } from './TodayHome';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string }>;
}) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    if (e instanceof Response) throw e;
    return null;
  }

  const { now, mskStart, mskEnd } = mskDayBounds();
  const resolvedSearchParams = await searchParams;

  let briefNarrative: { audioPath: string | null; narrativeText: string | null; id: string } | null = null;
  if (resolvedSearchParams?.brief) {
    const [found] = await db
      .select({
        id: morningNarratives.id,
        audioPath: morningNarratives.audioPath,
        narrativeText: morningNarratives.narrativeText,
      })
      .from(morningNarratives)
      .where(
        and(
          eq(morningNarratives.id, resolvedSearchParams.brief),
          eq(morningNarratives.adminId, user.id)
        )
      )
      .limit(1);
    briefNarrative = found ?? null;
  }

  const events = await db
    .select({
      e: agendaEvents,
      clientName: clients.name,
      objectTitle: objects.title,
    })
    .from(agendaEvents)
    .leftJoin(
      clients,
      and(eq(agendaEvents.clientId, clients.id), eq(clients.organizationId, user.organizationId))
    )
    .leftJoin(
      objects,
      and(eq(agendaEvents.objectId, objects.id), eq(objects.organizationId, user.organizationId))
    )
    .where(
      and(
        eq(agendaEvents.agentId, user.id),
        gte(agendaEvents.scheduledAt, mskStart),
        lt(agendaEvents.scheduledAt, mskEnd),
        ne(agendaEvents.status, 'cancelled')
      )
    )
    .orderBy(asc(agendaEvents.scheduledAt));

  return <TodayHome events={events} nowIso={now.toISOString()} briefNarrative={briefNarrative} />;
}
