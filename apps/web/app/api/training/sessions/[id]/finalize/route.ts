import { NextRequest, NextResponse } from 'next/server';
import { db, trainingSessions, type TrainingTurn } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { analyzeSpin } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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
  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(eq(trainingSessions.id, id), eq(trainingSessions.agentId, user.id))
    )
    .limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const transcript = session.transcript as TrainingTurn[];
  if (transcript.filter((t) => t.role === 'agent').length === 0) {
    return NextResponse.json(
      { error: 'No agent turns to analyze' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeSpin(transcript);
    const completedAt = new Date();
    const durationMs =
      completedAt.getTime() - new Date(session.createdAt).getTime();

    const [updated] = await db
      .update(trainingSessions)
      .set({
        status: 'completed',
        spinAnalysis: analysis,
        completedAt,
        durationSec: String(Math.floor(durationMs / 1000)),
      })
      .where(eq(trainingSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated, analysis });
  } catch (e) {
    console.error('[finalize]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Analyze failed' },
      { status: 500 }
    );
  }
}
