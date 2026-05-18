import { NextRequest, NextResponse } from 'next/server';
import { db, showReports } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin, requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const [report] = await db
    .select()
    .from(showReports)
    .where(eq(showReports.id, id))
    .limit(1);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (report.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (user.role !== 'admin' && report.agentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(report);
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
  const body = (await req.json()) as {
    fields?: Partial<typeof showReports.$inferSelect.fields>;
    contactType?: 'showing' | 'whatsapp' | 'phone' | 'other';
    status?: 'draft' | 'final';
  };
  const [report] = await db
    .select()
    .from(showReports)
    .where(eq(showReports.id, id))
    .limit(1);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (report.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (user.role !== 'admin' && report.agentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Partial<typeof showReports.$inferInsert> = {};
  if (body.fields) updates.fields = { ...report.fields, ...body.fields };
  if (body.contactType) updates.contactType = body.contactType;
  if (body.status === 'final') {
    updates.status = 'final';
    updates.finalizedAt = new Date();
  }

  const [updated] = await db
    .update(showReports)
    .set(updates)
    .where(eq(showReports.id, id))
    .returning();

  if (body.status === 'final' && updated?.clientId) {
    fetch(new URL(`/api/clients/${updated.clientId}/resummarize`, req.url), {
      method: 'POST',
      headers: { Cookie: req.headers.get('cookie') ?? '' },
    }).catch((e) => console.error('resummarize trigger failed:', e));
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
  await db
    .delete(showReports)
    .where(
      and(
        eq(showReports.id, id),
        eq(showReports.organizationId, user.organizationId)
      )
    );
  return NextResponse.json({ ok: true });
}
