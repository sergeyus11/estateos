import { NextRequest, NextResponse } from 'next/server';
import { db, showReports, users } from '@estateos/db';
import { eq, desc, and } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const filterAgent = url.searchParams.get('agentId');
  const filterStatus = url.searchParams.get('status');

  const conditions = [eq(showReports.organizationId, user.organizationId)];
  if (user.role === 'agent') conditions.push(eq(showReports.agentId, user.id));
  if (filterAgent && user.role === 'admin')
    conditions.push(eq(showReports.agentId, filterAgent));
  if (filterStatus === 'final' || filterStatus === 'draft') {
    conditions.push(eq(showReports.status, filterStatus));
  }

  const rows = await db
    .select({
      report: showReports,
      agent: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(and(...conditions))
    .orderBy(desc(showReports.createdAt))
    .limit(limit);

  return NextResponse.json(rows);
}
