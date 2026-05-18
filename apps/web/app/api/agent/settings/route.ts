import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { agentSettings, db } from '@estateos/db';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_BRIEF_AT = '08:30';

const PatchSchema = z.object({
  dayOffDate: z.string().nullable().optional(),
  briefAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

function serializeSettings(row?: typeof agentSettings.$inferSelect) {
  return {
    dayOffDate: row?.dayOffDate ?? null,
    briefAt: row?.briefAt ?? DEFAULT_BRIEF_AT,
  };
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

  const [settings] = await db
    .select()
    .from(agentSettings)
    .where(eq(agentSettings.userId, user.id))
    .limit(1);

  return NextResponse.json(serializeSettings(settings));
}

export async function PATCH(req: NextRequest) {
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

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const now = new Date();
  const insertValues: typeof agentSettings.$inferInsert = {
    userId: user.id,
    dayOffDate: data.dayOffDate ?? null,
    briefAt: data.briefAt ?? DEFAULT_BRIEF_AT,
    updatedAt: now,
  };
  const updates: Partial<typeof agentSettings.$inferInsert> = { updatedAt: now };

  if (data.dayOffDate !== undefined) updates.dayOffDate = data.dayOffDate;
  if (data.briefAt !== undefined) updates.briefAt = data.briefAt;

  const [settings] = await db
    .insert(agentSettings)
    .values(insertValues)
    .onConflictDoUpdate({
      target: agentSettings.userId,
      set: updates,
    })
    .returning();

  return NextResponse.json(serializeSettings(settings));
}
