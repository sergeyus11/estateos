import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { and, eq } from 'drizzle-orm';
import { db, showReports, agendaEvents } from '@estateos/db';
import {
  transcribe,
  extractFields,
  extractFieldsByEventType,
  generateFollowUpQuestion,
} from '@estateos/ai';
import type { DynamicReportFields, EventType, ReportFields } from '@estateos/ai';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { saveAudio } from '@/lib/audio-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_EVENT_TYPES: EventType[] = ['showing', 'meeting', 'call', 'task'];
const SHOWING_FIELD_KEYS: Array<keyof ReportFields> = [
  'object',
  'client',
  'budget',
  'reaction',
  'nextStep',
];

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('audio') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 });
  }
  const eventIdRaw = form.get('event_id') as string | null;
  const eventTypeRaw = form.get('event_type') as string | null;
  const eventType =
    eventTypeRaw && VALID_EVENT_TYPES.includes(eventTypeRaw as EventType)
      ? (eventTypeRaw as EventType)
      : null;

  let resolvedEventId: string | null = null;
  let resolvedClientId: string | null = null;
  if (eventIdRaw) {
    const baseConditions = [
      eq(agendaEvents.id, eventIdRaw),
      eq(agendaEvents.organizationId, user.organizationId),
    ];
    const conditions =
      user.role === 'admin'
        ? baseConditions
        : [...baseConditions, eq(agendaEvents.agentId, user.id)];
    const [evRow] = await db
      .select({ clientId: agendaEvents.clientId })
      .from(agendaEvents)
      .where(and(...conditions))
      .limit(1);

    if (!evRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    resolvedEventId = eventIdRaw;
    resolvedClientId = evRow.clientId ?? null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'audio/webm';

  try {
    const audioUrl = await saveAudio(buffer, mimeType);
    const { transcript } = await transcribe(buffer, mimeType);
    let fields: ReportFields | DynamicReportFields;
    let missing: Array<keyof ReportFields>;
    let fieldsForFollowUp: ReportFields | null = null;
    if (eventType) {
      const extracted = await extractFieldsByEventType<DynamicReportFields>(
        transcript,
        eventType
      );
      fields = extracted ?? {};
      if (eventType === 'showing') {
        const showingFields = fields as ReportFields;
        fieldsForFollowUp = showingFields;
        missing = SHOWING_FIELD_KEYS.filter(
          (k) =>
            showingFields[k] === null ||
            showingFields[k] === undefined ||
            showingFields[k] === ''
        );
      } else {
        // Meeting/call/task have simpler 2-3 field schemas, no round-trip needed.
        missing = [];
      }
    } else {
      const result = await extractFields(transcript);
      fields = result.fields;
      missing = result.missing;
      fieldsForFollowUp = result.fields;
    }
    const followUpQ =
      missing.length > 0 && fieldsForFollowUp
        ? await generateFollowUpQuestion(fieldsForFollowUp, missing)
        : null;

    const reportId = nanoid(16);
    const [report] = await db
      .insert(showReports)
      .values({
        id: reportId,
        organizationId: user.organizationId,
        agentId: user.id,
        voiceUrl: audioUrl,
        transcript,
        fields: fields as ReportFields,
        rounds: [],
        followUpQuestion: followUpQ,
        status: 'draft',
        eventId: resolvedEventId ?? undefined,
        clientId: resolvedClientId ?? undefined,
      })
      .returning();

    if (resolvedEventId) {
      await db
        .update(agendaEvents)
        .set({ status: 'in_progress', reportId: report.id, updatedAt: new Date() })
        .where(
          and(
            eq(agendaEvents.id, resolvedEventId),
            eq(agendaEvents.organizationId, user.organizationId)
          )
        );
    }

    return NextResponse.json({
      id: report.id,
      transcript,
      fields,
      missing,
      followUpQuestion: followUpQ,
    });
  } catch (e) {
    console.error('[transcribe]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Transcribe failed' },
      { status: 500 }
    );
  }
}
