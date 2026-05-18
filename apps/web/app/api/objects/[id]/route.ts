import { NextRequest, NextResponse } from 'next/server';
import { db, agendaEvents, objects } from '@estateos/db';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchObjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  price: z.number().positive().nullable().optional(),
  propertyType: z.enum(['flat', 'commercial', 'house', 'land']).optional(),
  rooms: z.number().int().positive().nullable().optional(),
  area: z.number().positive().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  status: z.enum(['active', 'reserved', 'sold', 'withdrawn']).optional(),
});

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
  const [object] = await db.select().from(objects).where(eq(objects.id, id)).limit(1);
  if (!object) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (object.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const relatedEvents = await db
    .select()
    .from(agendaEvents)
    .where(
      and(
        eq(agendaEvents.organizationId, user.organizationId),
        eq(agendaEvents.objectId, id)
      )
    )
    .orderBy(asc(agendaEvents.scheduledAt));

  return NextResponse.json({ object, relatedEvents });
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

  const parsed = PatchObjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid object', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updates: Partial<typeof objects.$inferInsert> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.address !== undefined) updates.address = data.address;
  if (data.price !== undefined) updates.price = data.price === null ? null : data.price.toString();
  if (data.propertyType !== undefined) updates.propertyType = data.propertyType;
  if (data.rooms !== undefined) updates.rooms = data.rooms;
  if (data.area !== undefined) updates.area = data.area === null ? null : data.area.toString();
  if (data.ownerName !== undefined) updates.ownerName = data.ownerName;
  if (data.ownerPhone !== undefined) updates.ownerPhone = data.ownerPhone;
  if (data.status !== undefined) updates.status = data.status;

  const [updated] = await db
    .update(objects)
    .set(updates)
    .where(and(eq(objects.id, id), eq(objects.organizationId, user.organizationId)))
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
    .delete(objects)
    .where(and(eq(objects.id, id), eq(objects.organizationId, user.organizationId)))
    .returning({ id: objects.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
