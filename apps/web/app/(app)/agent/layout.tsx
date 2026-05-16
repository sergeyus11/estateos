import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@estateos/auth';
import { db, users } from '@estateos/db';
import { eq } from 'drizzle-orm';

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect('/login');

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h2 className="text-lg font-semibold">EstateOS</h2>
          <a href="/api/auth/sign-out" className="text-sm text-neutral-600 hover:underline">Выйти</a>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
