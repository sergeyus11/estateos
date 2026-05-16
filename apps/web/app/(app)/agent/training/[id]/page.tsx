import { db, trainingSessions, trainingPersonas } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { notFound } from 'next/navigation';
import { SessionPlayer } from './SessionPlayer';

export const dynamic = 'force-dynamic';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAgentOrAdmin();
  const { id } = await params;

  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.id, id),
        eq(trainingSessions.organizationId, user.organizationId)
      )
    )
    .limit(1);
  if (!session) notFound();
  if (user.role !== 'admin' && session.agentId !== user.id) notFound();

  const [persona] = await db
    .select()
    .from(trainingPersonas)
    .where(eq(trainingPersonas.id, session.personaId))
    .limit(1);

  return (
    <SessionPlayer
      sessionId={session.id}
      personaName={persona?.name || session.personaId}
      personaDescription={persona?.description || ''}
      initialTranscript={session.transcript}
      initialStatus={session.status}
      initialAnalysis={session.spinAnalysis}
    />
  );
}
