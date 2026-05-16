import { NextResponse } from 'next/server';
import { db, trainingPersonas } from '@estateos/db';
import { isNull, or, eq } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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
    .from(trainingPersonas)
    .where(
      or(
        isNull(trainingPersonas.organizationId),
        eq(trainingPersonas.organizationId, user.organizationId)
      )
    );

  return NextResponse.json(list);
}
