import { NextRequest, NextResponse } from 'next/server';
import { db, objects } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateObjectSchema = z.object({
  title: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  price: z.number().positive().nullable().optional(),
  propertyType: z.enum(['flat', 'commercial', 'house', 'land']),
  rooms: z.number().int().positive().nullable().optional(),
  area: z.number().positive().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  status: z.enum(['active', 'reserved', 'sold', 'withdrawn']).optional().default('active'),
});

export async function GET(_req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = await db
    .select()
    .from(objects)
    .where(eq(objects.organizationId, user.organizationId))
    .orderBy(desc(objects.updatedAt));

  return NextResponse.json(list);
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

  const parsed = CreateObjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid object', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const [created] = await db
    .insert(objects)
    .values({
      id: nanoid(16),
      organizationId: user.organizationId,
      createdByUserId: user.id,
      title: data.title,
      address: data.address,
      price: data.price === undefined || data.price === null ? null : data.price.toString(),
      propertyType: data.propertyType,
      rooms: data.rooms ?? null,
      area: data.area === undefined || data.area === null ? null : data.area.toString(),
      ownerName: data.ownerName ?? null,
      ownerPhone: data.ownerPhone ?? null,
      status: data.status,
      photos: [],
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
