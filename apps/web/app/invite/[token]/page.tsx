import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { db, magicLinkInvites, users } from '@estateos/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function InviteConsumer({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invite] = await db
    .select()
    .from(magicLinkInvites)
    .where(eq(magicLinkInvites.token, token))
    .limit(1);

  if (!invite) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-semibold">Ссылка не найдена</h1>
        <p className="mt-4 text-neutral-600">
          Возможно, ссылка устарела. Попросите admin&apos;а отправить новую.
        </p>
      </main>
    );
  }
  if (invite.consumedAt) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-semibold">Ссылка уже использована</h1>
        <p className="mt-4 text-neutral-600">
          Войдите через{' '}
          <a href="/login" className="underline">
            /login
          </a>
          , указав email <strong>{invite.email}</strong>.
        </p>
      </main>
    );
  }
  if (invite.expiresAt < new Date()) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-semibold">Срок ссылки истёк</h1>
        <p className="mt-4 text-neutral-600">Попросите admin&apos;а прислать новую.</p>
      </main>
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      id: nanoid(16),
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      telegramUsername: invite.telegramUsername,
      role: invite.role,
      organizationId: invite.organizationId,
      isActive: true,
    });
  }

  await db
    .update(magicLinkInvites)
    .set({ consumedAt: new Date() })
    .where(eq(magicLinkInvites.id, invite.id));

  redirect(`/login?email=${encodeURIComponent(invite.email)}&autosend=1`);
}
