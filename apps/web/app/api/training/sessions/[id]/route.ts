import { NextRequest, NextResponse } from 'next/server';
import { db, trainingSessions, trainingPersonas } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
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
  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (user.role !== 'admin' && session.agentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [persona] = await db
    .select()
    .from(trainingPersonas)
    .where(eq(trainingPersonas.id, session.personaId))
    .limit(1);

  return NextResponse.json({
    session,
    persona: persona
      ? {
          id: persona.id,
          name: persona.name,
          description: persona.description,
          voiceId: persona.voiceId,
        }
      : null,
  });
}

export async function DELETE(
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
  await db
    .delete(trainingSessions)
    .where(
      and(
        eq(trainingSessions.id, id),
        eq(trainingSessions.organizationId, user.organizationId)
      )
    );
  return NextResponse.json({ ok: true });
}
