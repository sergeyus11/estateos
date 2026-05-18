import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db, clients, objects } from '@estateos/db';
import { parseEventCommand, transcribe } from '@estateos/ai';
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audio = formData.get('audio') as File | null;
  if (!audio) {
    return NextResponse.json({ error: 'No audio' }, { status: 400 });
  }

  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const { transcript } = await transcribe(buf, audio.type || 'audio/webm');
    if (!transcript) {
      return NextResponse.json({ error: 'STT failed' }, { status: 422 });
    }

    const ownClients = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.organizationId, user.organizationId))
      .orderBy(desc(clients.updatedAt))
      .limit(50);

    const ownObjects = await db
      .select({ id: objects.id, title: objects.title, address: objects.address })
      .from(objects)
      .where(eq(objects.organizationId, user.organizationId))
      .orderBy(desc(objects.updatedAt))
      .limit(50);

    const parsed = await parseEventCommand({
      transcript,
      today_iso: new Date().toISOString(),
      agent_name: user.email,
      client_list: ownClients,
      object_list: ownObjects.map((object) => ({
        id: object.id,
        title: object.title,
        address: object.address ?? '',
      })),
    });

    if (!parsed || parsed.confidence < 0.4) {
      return NextResponse.json({
        transcript,
        intent: 'unclear',
        reason: 'Не понял команду, попробуй сказать иначе.',
      });
    }

    return NextResponse.json({ transcript, intent: 'create_event', preview: parsed });
  } catch (e) {
    console.error('[voice/command]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Voice command failed' },
      { status: 500 }
    );
  }
}
