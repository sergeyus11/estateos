import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@estateos/auth';
import { db, users, organizations } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { AgentShellClient } from '@/app/components/AgentShellClient';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect('/login');

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect('/login');

  const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);

  return (
    <AgentShellClient
      user={{
        name: user.firstName || user.email,
        email: user.email,
        orgName: org?.name ?? null,
        role: user.role,
      }}
    >
      {children}
    </AgentShellClient>
  );
}
