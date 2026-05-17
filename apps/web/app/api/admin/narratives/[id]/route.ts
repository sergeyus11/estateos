import { NextRequest, NextResponse } from 'next/server';
import { db, morningNarratives } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const [row] = await db
    .select()
    .from(morningNarratives)
    .where(
      and(
        eq(morningNarratives.id, id),
        eq(morningNarratives.organizationId, admin.organizationId),
        eq(morningNarratives.adminId, admin.id)
      )
    )
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ narrative: row });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === 'mark-listened') {
    await db
      .update(morningNarratives)
      .set({ listenedAt: new Date() })
      .where(
        and(
          eq(morningNarratives.id, id),
          eq(morningNarratives.organizationId, admin.organizationId),
          eq(morningNarratives.adminId, admin.id)
        )
      );
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Bad action' }, { status: 400 });
}
