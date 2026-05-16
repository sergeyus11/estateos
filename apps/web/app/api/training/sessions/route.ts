import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, trainingSessions, trainingPersonas, type TrainingTurn } from '@estateos/db';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { generatePersonaOpener } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

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

  const body = (await req.json()) as { personaId: string };
  if (!body.personaId) {
    return NextResponse.json({ error: 'personaId required' }, { status: 400 });
  }

  const [persona] = await db
    .select()
    .from(trainingPersonas)
    .where(
      and(
        eq(trainingPersonas.id, body.personaId),
        or(
          isNull(trainingPersonas.organizationId),
          eq(trainingPersonas.organizationId, user.organizationId)
        )
      )
    )
    .limit(1);

  if (!persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
  }

  try {
    const openerText = await generatePersonaOpener(persona.systemPrompt);
    const sessionId = nanoid(16);
    const opener: TrainingTurn = {
      role: 'client',
      text: openerText,
      audioUrl: null,
      ts: new Date().toISOString(),
    };

    const [session] = await db
      .insert(trainingSessions)
      .values({
        id: sessionId,
        organizationId: user.organizationId,
        agentId: user.id,
        personaId: persona.id,
        transcript: [opener],
        status: 'in_progress',
      })
      .returning();

    return NextResponse.json({
      session,
      persona: {
        id: persona.id,
        name: persona.name,
        description: persona.description,
        ageHint: persona.ageHint,
        budgetHint: persona.budgetHint,
        voiceId: persona.voiceId,
      },
    });
  } catch (e) {
    console.error('[training/sessions POST]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    );
  }
}

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
  const onlyMine = url.searchParams.get('mine') === '1' || user.role === 'agent';

  const conditions = [eq(trainingSessions.organizationId, user.organizationId)];
  if (onlyMine) conditions.push(eq(trainingSessions.agentId, user.id));

  const rows = await db
    .select()
    .from(trainingSessions)
    .where(and(...conditions))
    .orderBy(desc(trainingSessions.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}
