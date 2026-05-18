import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { db, clients, objects } from '@estateos/db';
import { classifyVoiceCommand, llmChat, parseEventCommand, transcribe } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function searchEntities(
  entity: string,
  filterText: string,
  user: { organizationId: string; id: string; role: string },
): Promise<unknown[]> {
  const normalizedFilter = filterText.trim();
  const pattern = `%${normalizedFilter}%`;

  if (entity === 'clients') {
    return db
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, user.organizationId),
          normalizedFilter ? ilike(clients.name, pattern) : undefined,
        ),
      )
      .limit(10);
  }

  if (entity === 'objects') {
    return db
      .select({ id: objects.id, title: objects.title, address: objects.address })
      .from(objects)
      .where(
        and(
          eq(objects.organizationId, user.organizationId),
          normalizedFilter ? ilike(objects.title, pattern) : undefined,
        ),
      )
      .limit(10);
  }

  return [];
}

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

  const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: 'Audio too large', max: MAX_AUDIO_BYTES },
      { status: 413 }
    );
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(await audio.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Failed to read audio' }, { status: 400 });
  }

  try {
    const { transcript } = await transcribe(buf, audio.type || 'audio/webm');
    if (!transcript) {
      return NextResponse.json({ error: 'STT failed' }, { status: 422 });
    }

    const currentScreen = (formData.get('current_screen') as string | null) ?? 'agent_home';
    const classification = await classifyVoiceCommand(transcript, currentScreen);

    if (!classification || classification.confidence < 0.4) {
      return NextResponse.json({
        transcript,
        intent: 'unclear',
        reason: 'Не понял команду, попробуй сказать иначе.',
      });
    }

    switch (classification.intent) {
      case 'create_event': {
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

        if (!parsed || parsed.confidence < 0.5) {
          return NextResponse.json({
            transcript,
            intent: 'unclear',
            reason: 'Не понял команду, попробуй сказать иначе.',
          });
        }

        return NextResponse.json({ transcript, intent: 'create_event', preview: parsed });
      }

      case 'search': {
        const entity = String(classification.payload.entity ?? 'clients');
        const filterText = String(classification.payload.filter_text ?? '');
        const results = await searchEntities(entity, filterText, user);
        return NextResponse.json({ transcript, intent: 'search', entity, results });
      }

      case 'send_template':
        return NextResponse.json({
          transcript,
          intent: 'send_template',
          draft: {
            client: classification.payload.client_name_or_id,
            message: '(будет реализовано в Phase 2)',
          },
        });

      case 'generic': {
        const { text: answer } = await llmChat(
          'Ты — AI-ассистент риелтор-агента. Отвечай кратко и по делу, на русском.',
          String(classification.payload.question ?? transcript),
          { task: 'command', temperature: 0.5, maxTokens: 300 },
        );
        return NextResponse.json({ transcript, intent: 'generic', answer });
      }
    }
  } catch (e) {
    console.error('[voice/command]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Voice command failed' },
      { status: 500 }
    );
  }
}
