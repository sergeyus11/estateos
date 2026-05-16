import { NextRequest, NextResponse } from 'next/server';
import { db, showReports, type ReportRound } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { transcribe, mergeAnswer, generateFollowUpQuestion } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ROUNDS = 3;
const FIELD_KEYS = ['object', 'client', 'budget', 'reaction', 'nextStep'] as const;

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const reportId = form.get('reportId') as string | null;
  const file = form.get('audio') as File | null;
  if (!reportId || !file) {
    return NextResponse.json(
      { error: 'reportId and audio required' },
      { status: 400 }
    );
  }

  const [report] = await db
    .select()
    .from(showReports)
    .where(and(eq(showReports.id, reportId), eq(showReports.agentId, user.id)))
    .limit(1);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const existingRounds = (report.rounds || []) as ReportRound[];
  if (existingRounds.length >= MAX_ROUNDS) {
    return NextResponse.json(
      { error: 'Max rounds reached', maxReached: true },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { transcript } = await transcribe(buffer, file.type || 'audio/webm');
    const newFields = await mergeAnswer(
      report.fields,
      report.followUpQuestion || '',
      transcript
    );

    const missing = FIELD_KEYS.filter(
      (k) => !newFields[k] || newFields[k] === ''
    );
    const updatedRoundsCount = existingRounds.length + 1;
    const newFollowUp =
      missing.length > 0 && updatedRoundsCount < MAX_ROUNDS
        ? await generateFollowUpQuestion(newFields, missing as unknown as Array<keyof typeof newFields>)
        : null;

    const updatedRounds: ReportRound[] = [
      ...existingRounds,
      {
        transcript,
        question: report.followUpQuestion,
        answer: transcript,
        ts: new Date().toISOString(),
      },
    ];

    const [updated] = await db
      .update(showReports)
      .set({
        fields: newFields,
        rounds: updatedRounds,
        followUpQuestion: newFollowUp,
      })
      .where(eq(showReports.id, reportId))
      .returning();

    return NextResponse.json({
      id: updated.id,
      fields: newFields,
      missing,
      followUpQuestion: newFollowUp,
      roundsUsed: updatedRounds.length,
      maxReached: updatedRounds.length >= MAX_ROUNDS,
    });
  } catch (e) {
    console.error('[refine]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Refine failed' },
      { status: 500 }
    );
  }
}
