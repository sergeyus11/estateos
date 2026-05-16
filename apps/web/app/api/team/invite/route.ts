import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, magicLinkInvites, organizations } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { sendInviteEmail } from '@estateos/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as {
    email: string;
    firstName?: string;
    lastName?: string;
    telegramUsername?: string;
  };
  if (!body.email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(magicLinkInvites).values({
    id: nanoid(16),
    token,
    email: body.email.toLowerCase().trim(),
    organizationId: user.organizationId,
    invitedByUserId: user.id,
    role: 'agent',
    firstName: body.firstName || null,
    lastName: body.lastName || null,
    telegramUsername: body.telegramUsername || null,
    expiresAt,
  });

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  const baseUrl = process.env.BETTER_AUTH_URL || 'https://estateos.ru';
  const inviteUrl = `${baseUrl}/invite/${token}`;

  try {
    await sendInviteEmail(body.email, inviteUrl, org?.name || 'EstateOS', body.firstName || null);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to send invite email', details: String(e) },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
