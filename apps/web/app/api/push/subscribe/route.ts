import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, pushSubscriptions } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sub = (await req.json()) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, sub.endpoint))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, existed: true });
  }
  await db.insert(pushSubscriptions).values({
    id: nanoid(16),
    userId: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    authKey: sub.keys.auth,
  });
  return NextResponse.json({ ok: true });
}
