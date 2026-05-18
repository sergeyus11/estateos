import { headers } from 'next/headers';
import { auth } from '@estateos/auth';
import { db, users, type User } from '@estateos/db';
import { eq } from 'drizzle-orm';

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) return null;
  if (user.isActive !== true) return null;
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });
  if (user.role !== 'admin') throw new Response('Forbidden', { status: 403 });
  return user;
}

export async function requireAgentOrAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });
  return user;
}
