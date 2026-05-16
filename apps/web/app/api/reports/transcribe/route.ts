import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, showReports } from '@estateos/db';
import { transcribe, extractFields, generateFollowUpQuestion } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { saveAudio } from '@/lib/audio-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('audio') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'audio/webm';

  try {
    const audioUrl = await saveAudio(buffer, mimeType);
    const { transcript } = await transcribe(buffer, mimeType);
    const { fields, missing } = await extractFields(transcript);
    const followUpQ =
      missing.length > 0
        ? await generateFollowUpQuestion(fields, missing)
        : null;

    const reportId = nanoid(16);
    const [report] = await db
      .insert(showReports)
      .values({
        id: reportId,
        organizationId: user.organizationId,
        agentId: user.id,
        voiceUrl: audioUrl,
        transcript,
        fields,
        rounds: [],
        followUpQuestion: followUpQ,
        status: 'draft',
      })
      .returning();

    return NextResponse.json({
      id: report.id,
      transcript,
      fields,
      missing,
      followUpQuestion: followUpQ,
    });
  } catch (e) {
    console.error('[transcribe]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Transcribe failed' },
      { status: 500 }
    );
  }
}
