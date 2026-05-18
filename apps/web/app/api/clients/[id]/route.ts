import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, clients, agendaEvents, showReports } from '@estateos/db';
import { eq, desc, and } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateClientSchema = z
  .object({
    name: z.string().min(1).max(200),
    phone: z.string().nullable().optional(),
    telegram: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    budgetMin: z.number().nullable().optional(),
    budgetMax: z.number().nullable().optional(),
    preferences: z.array(z.string()).optional(),
    status: z.enum(['new', 'active', 'thinking', 'negotiating', 'closed_won', 'closed_lost']),
  })
  .partial();

function numericToDbValue(value: number | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const events = await db
    .select()
    .from(agendaEvents)
    .where(and(eq(agendaEvents.clientId, id), eq(agendaEvents.organizationId, user.organizationId)))
    .orderBy(desc(agendaEvents.scheduledAt));

  const reports = await db
    .select()
    .from(showReports)
    .where(and(eq(showReports.clientId, id), eq(showReports.organizationId, user.organizationId)))
    .orderBy(desc(showReports.createdAt));

  return NextResponse.json({ ...client, events, reports });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  const rawBody: unknown = await req.json().catch(() => null);
  const parsed = UpdateClientSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const [row] = await db
    .update(clients)
    .set({
      ...body,
      budgetMin: numericToDbValue(body.budgetMin),
      budgetMax: numericToDbValue(body.budgetMax),
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, user.organizationId)))
    .returning();

  if (!row) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(row);
}
