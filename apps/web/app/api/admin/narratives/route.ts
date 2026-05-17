import { NextResponse } from 'next/server';
import { db, morningNarratives } from '@estateos/db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await db
    .select()
    .from(morningNarratives)
    .where(
      and(
        eq(morningNarratives.organizationId, admin.organizationId),
        eq(morningNarratives.adminId, admin.id)
      )
    )
    .orderBy(desc(morningNarratives.createdAt))
    .limit(30);
  return NextResponse.json({ narratives: rows });
}
