import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db, clients } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateClientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  preferences: z.array(z.string()).optional().default([]),
  status: z
    .enum(['new', 'active', 'thinking', 'negotiating', 'closed_won', 'closed_lost'])
    .optional()
    .default('new'),
});

function numericToDbValue(value: number | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

export async function GET(_req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, user.organizationId))
    .orderBy(desc(clients.updatedAt))
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

  const rawBody: unknown = await req.json().catch(() => null);
  const parsed = CreateClientSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const [row] = await db
    .insert(clients)
    .values({
      id: nanoid(16),
      organizationId: user.organizationId,
      createdByUserId: user.id,
      name: body.name,
      phone: body.phone,
      telegram: body.telegram,
      email: body.email,
      budgetMin: numericToDbValue(body.budgetMin),
      budgetMax: numericToDbValue(body.budgetMax),
      preferences: body.preferences,
      status: body.status,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
