import { headers } from 'next/headers';
import { db, showReports, users } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@estateos/auth';
import { redirect } from 'next/navigation';
import { AgentHome } from './AgentHome';

export const dynamic = 'force-dynamic';

export default async function AgentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect('/login');

  const recent = await db
    .select()
    .from(showReports)
    .where(eq(showReports.agentId, user.id))
    .orderBy(desc(showReports.createdAt))
    .limit(5);

  return (
    <AgentHome
      firstName={user.firstName}
      recent={recent.map((r) => ({
        id: r.id,
        fields: r.fields,
        status: r.status,
        followUpQuestion: r.followUpQuestion,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
