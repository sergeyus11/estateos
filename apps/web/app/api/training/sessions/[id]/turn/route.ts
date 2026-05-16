import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  trainingSessions,
  trainingPersonas,
  type TrainingTurn,
} from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { generatePersonaReply, shouldEnd } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TURNS = 30;

export async function POST(
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
  const body = (await req.json()) as { text: string };
  if (!body.text || !body.text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(eq(trainingSessions.id, id), eq(trainingSessions.agentId, user.id))
    )
    .limit(1);

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session ended' }, { status: 400 });
  }

  const [persona] = await db
    .select()
    .from(trainingPersonas)
    .where(eq(trainingPersonas.id, session.personaId))
    .limit(1);
  if (!persona) {
    return NextResponse.json({ error: 'Persona missing' }, { status: 500 });
  }

  const history = session.transcript as TrainingTurn[];
  const agentTurn: TrainingTurn = {
    role: 'agent',
    text: body.text.trim(),
    audioUrl: null,
    ts: new Date().toISOString(),
  };
  const withAgent: TrainingTurn[] = [...history, agentTurn];

  // End if agent says farewell or turn cap reached
  const isEndByAgent = shouldEnd(body.text);
  let clientTurn: TrainingTurn | null = null;
  let endNow = isEndByAgent || withAgent.length >= MAX_TURNS;

  if (!endNow) {
    try {
      const reply = await generatePersonaReply(
        persona.systemPrompt,
        history,
        body.text
      );
      clientTurn = {
        role: 'client',
        text: reply,
        audioUrl: null,
        ts: new Date().toISOString(),
      };
      if (shouldEnd(reply)) endNow = true;
    } catch (e) {
      console.error('[turn]', e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Reply failed' },
        { status: 500 }
      );
    }
  }

  const updatedTranscript: TrainingTurn[] = clientTurn
    ? [...withAgent, clientTurn]
    : withAgent;

  const [updated] = await db
    .update(trainingSessions)
    .set({ transcript: updatedTranscript })
    .where(eq(trainingSessions.id, id))
    .returning();

  return NextResponse.json({
    session: updated,
    clientReply: clientTurn?.text || null,
    endNow,
  });
}
