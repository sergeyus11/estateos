import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, agendaEvents } from '@estateos/db';
import { requireAdmin, requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function scopeConditions(user: { id: string; organizationId: string; role: string }, id: string) {
  const base = [eq(agendaEvents.id, id), eq(agendaEvents.organizationId, user.organizationId)];
  return user.role === 'admin' ? base : [...base, eq(agendaEvents.agentId, user.id)];
}

const PatchEventSchema = z
  .object({
    status: z.enum(['planned', 'in_progress', 'done', 'cancelled']),
    title: z.string().min(1).max(200),
    scheduledAt: z.string().datetime({ offset: true }),
    durationMin: z.number().int().positive(),
    notes: z.string().nullable(),
    address: z.string().nullable(),
    clientId: z.string().nullable(),
    objectId: z.string().nullable(),
  })
  .partial();

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
  const [event] = await db
    .select()
    .from(agendaEvents)
    .where(and(...scopeConditions(user, id)))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(event);
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PatchEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updates: Partial<typeof agendaEvents.$inferInsert> = { updatedAt: new Date() };
  if (data.status !== undefined) updates.status = data.status;
  if (data.title !== undefined) updates.title = data.title;
  if (data.scheduledAt !== undefined) updates.scheduledAt = new Date(data.scheduledAt);
  if (data.durationMin !== undefined) updates.durationMin = data.durationMin;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.address !== undefined) updates.address = data.address;
  if (data.clientId !== undefined) updates.clientId = data.clientId;
  if (data.objectId !== undefined) updates.objectId = data.objectId;

  const [updated] = await db
    .update(agendaEvents)
    .set(updates)
    .where(and(...scopeConditions(user, id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(agendaEvents)
    .where(and(...scopeConditions(user, id)))
    .returning({ id: agendaEvents.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
