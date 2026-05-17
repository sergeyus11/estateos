import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@estateos/auth';
import { db, users } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { AdminShellClient } from '@/app/components/AdminShellClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect('/login');

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user || user.role !== 'admin') redirect('/agent');

  return <AdminShellClient>{children}</AdminShellClient>;
}
