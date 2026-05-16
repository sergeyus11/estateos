import { NextRequest, NextResponse } from 'next/server';
import { db, showReports } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { synthesize } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

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
  if (!report?.followUpQuestion) {
    return NextResponse.json({ error: 'No follow-up' }, { status: 404 });
  }
  if (report.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (report.agentId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { audio } = await synthesize(report.followUpQuestion, 'nova', 'tts-1-hd');
  return new NextResponse(new Uint8Array(audio), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
