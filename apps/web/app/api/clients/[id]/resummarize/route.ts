import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, clients, agendaEvents, showReports } from '@estateos/db';
import { summarizeClient, type SummarizeClientEvent } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

const RESUMMARIZE_MIN_INTERVAL_MS = 60 * 60 * 1000;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, user.organizationId)))
    .limit(1);

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const force = req.nextUrl.searchParams.get('force') === '1';
  if (!force && client.aiSummaryUpdatedAt) {
    const age = Date.now() - new Date(client.aiSummaryUpdatedAt).getTime();
    if (age < RESUMMARIZE_MIN_INTERVAL_MS) {
      return NextResponse.json({ skipped: true, reason: 'recent', age_ms: age });
    }
  }

  const events = await db
    .select()
    .from(agendaEvents)
    .where(and(eq(agendaEvents.clientId, id), eq(agendaEvents.organizationId, user.organizationId)))
    .orderBy(desc(agendaEvents.scheduledAt))
    .limit(10);

  const reportIds = events
    .map((e) => e.reportId)
    .filter((id): id is string => id !== null);
  const reports =
    reportIds.length > 0
      ? await db
          .select()
          .from(showReports)
          .where(
            and(
              inArray(showReports.id, reportIds),
              eq(showReports.organizationId, user.organizationId),
            ),
          )
      : [];

  const reportsMap = new Map(
    reports.map((r) => [
      r.id,
      {
        transcript: r.transcript ?? '',
        fields: (r.fields as Record<string, unknown>) ?? {},
      },
    ]),
  );

  const enrichedEvents: SummarizeClientEvent[] = events.map((event) => ({
    eventType: event.eventType,
    scheduledAt: event.scheduledAt,
    title: event.title,
    transcript: event.reportId ? reportsMap.get(event.reportId)?.transcript : undefined,
    fields: event.reportId ? reportsMap.get(event.reportId)?.fields : undefined,
  }));

  const result = await summarizeClient(
    {
      name: client.name,
      budgetMin: client.budgetMin,
      budgetMax: client.budgetMax,
      status: client.status,
      preferences: (client.preferences as string[]) ?? [],
    },
    enrichedEvents,
  );

  const [updated] = await db
    .update(clients)
    .set({
      aiSummary: result.summary,
      aiSummaryUpdatedAt: new Date(),
      preferences: result.pref_chips,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, user.organizationId)))
    .returning();

  return NextResponse.json({
    ...updated,
    next_step_suggestion: result.next_step_suggestion,
  });
}
