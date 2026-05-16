import { InviteForm } from './InviteForm';
import { db, users, magicLinkInvites } from '@estateos/db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const admin = await requireAdmin();
  const team = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, admin.organizationId))
    .orderBy(desc(users.createdAt));
  const pending = await db
    .select()
    .from(magicLinkInvites)
    .where(
      and(
        eq(magicLinkInvites.organizationId, admin.organizationId),
        isNull(magicLinkInvites.consumedAt)
      )
    )
    .orderBy(desc(magicLinkInvites.createdAt));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Команда</h1>
        <ul className="mt-4 space-y-2">
          {team.map((u) => (
            <li key={u.id} className="rounded-lg border bg-white p-4 text-sm">
              <div className="font-medium">{u.firstName || u.email}</div>
              <div className="text-neutral-500">
                {u.email} · {u.role} · {u.isActive ? 'active' : 'disabled'}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Ожидают приглашения</h2>
          <ul className="mt-2 space-y-2">
            {pending.map((i) => (
              <li key={i.id} className="rounded-lg bg-neutral-50 p-3 text-sm">
                {i.email} · {i.role} · до {i.expiresAt.toLocaleDateString('ru-RU')}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Пригласить агента</h2>
        <InviteForm />
      </section>
    </div>
  );
}
