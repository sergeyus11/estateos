import { db, trainingPersonas, trainingSessions } from '@estateos/db';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { TrainingHome } from './TrainingHome';

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const user = await requireAgentOrAdmin();

  const personas = await db
    .select()
    .from(trainingPersonas)
    .where(
      or(
        isNull(trainingPersonas.organizationId),
        eq(trainingPersonas.organizationId, user.organizationId)
      )
    );

  const myRecent = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.organizationId, user.organizationId),
        eq(trainingSessions.agentId, user.id)
      )
    )
    .orderBy(desc(trainingSessions.createdAt))
    .limit(5);

  return (
    <TrainingHome
      personas={personas.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        ageHint: p.ageHint,
        budgetHint: p.budgetHint,
        isStock: p.isStock,
      }))}
      recent={myRecent.map((s) => ({
        id: s.id,
        personaId: s.personaId,
        status: s.status,
        score: s.spinAnalysis?.score ?? null,
        turns: (s.transcript as { role: string }[]).length,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
