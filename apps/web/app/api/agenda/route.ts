import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db, agendaEvents } from '@estateos/db';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { mskDayBounds } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateEventSchema = z.object({
  eventType: z.enum(['showing', 'meeting', 'call', 'task']),
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMin: z.number().int().positive().optional().default(30),
  clientId: z.string().nullable().optional(),
  objectId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.enum(['manual', 'voice', 'auto_from_report']).optional().default('manual'),
});

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get('date');
  const conditions = [
    eq(agendaEvents.organizationId, user.organizationId),
    eq(agendaEvents.agentId, user.id),
  ];

  if (dateParam === 'today') {
    const { mskStart: start, mskEnd: end } = mskDayBounds();
    conditions.push(gte(agendaEvents.scheduledAt, start));
    conditions.push(lt(agendaEvents.scheduledAt, end));
  }

  const rows = await db
    .select()
    .from(agendaEvents)
    .where(and(...conditions))
    .orderBy(asc(agendaEvents.scheduledAt))
    .limit(500);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const [row] = await db
    .insert(agendaEvents)
    .values({
      id: nanoid(16),
      organizationId: user.organizationId,
      agentId: user.id,
      eventType: data.eventType,
      title: data.title,
      scheduledAt: new Date(data.scheduledAt),
      durationMin: data.durationMin,
      clientId: data.clientId ?? null,
      objectId: data.objectId ?? null,
      address: data.address ?? null,
      status: 'planned',
      notes: data.notes ?? null,
      source: data.source,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
