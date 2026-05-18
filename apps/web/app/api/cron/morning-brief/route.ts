import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  db,
  users,
  morningNarratives,
  agentSettings,
  clients,
  agendaEvents,
  organizations,
} from '@estateos/db';
import { and, asc, desc, eq, gte, inArray, lt, ne } from 'drizzle-orm';
import { generateMorningBrief, synthesize } from '@estateos/ai';
import { saveNarrativeAudio } from '@/lib/audio-storage';
import { sendPushToUser } from '@/lib/push';
import { mskDayBounds } from '@/lib/time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function formatMskTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

function formatMskDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00+03:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  });
}

function userBriefName(
  user: typeof users.$inferSelect,
  organization: typeof organizations.$inferSelect,
): string {
  if (user.role === 'admin') {
    return organization.name;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || organization.name;
}

function daysSince(date: Date, now: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((now.getTime() - date.getTime()) / dayMs));
}

function sanitizeBriefText(text: string): string {
  return text.replace(/партн[её]р\w*/gi, 'коллега');
}

function firstLine(text: string): string {
  const line = text.split('\n').map((part) => part.trim()).find(Boolean) ?? text.trim();
  return line.length > 140 ? `${line.slice(0, 137)}...` : line;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { todayStr, mskStart, mskEnd } = mskDayBounds();
  const staleBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const activeUsers = await db
    .select({ u: users, o: organizations })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.isActive, true));

  const results: Array<{ userId: string; ok: boolean; reason?: string }> = [];
  let skippedDayOff = 0;
  let skippedAlreadyReady = 0;

  for (const { u: user, o: organization } of activeUsers) {
    const [settings] = await db
      .select()
      .from(agentSettings)
      .where(eq(agentSettings.userId, user.id))
      .limit(1);

    if (settings?.dayOffDate === todayStr) {
      skippedDayOff++;
      results.push({ userId: user.id, ok: false, reason: 'day_off' });
      continue;
    }

    const [existing] = await db
      .select()
      .from(morningNarratives)
      .where(
        and(
          eq(morningNarratives.adminId, user.id),
          eq(morningNarratives.periodDate, todayStr)
        )
      )
      .limit(1);

    if (existing?.status === 'ready') {
      skippedAlreadyReady++;
      results.push({ userId: user.id, ok: false, reason: 'already_ready' });
      continue;
    }

    const narrativeId = existing?.id ?? nanoid(16);

    try {
      if (!existing) {
        await db.insert(morningNarratives).values({
          id: narrativeId,
          organizationId: user.organizationId,
          adminId: user.id,
          periodDate: todayStr,
          status: 'generating',
        });
      } else {
        await db
          .update(morningNarratives)
          .set({ status: 'generating', errorMessage: null })
          .where(eq(morningNarratives.id, narrativeId));
      }

      const agendaRows = await db
        .select({
          e: agendaEvents,
          clientName: clients.name,
        })
        .from(agendaEvents)
        .leftJoin(
          clients,
          and(
            eq(agendaEvents.clientId, clients.id),
            eq(clients.organizationId, user.organizationId)
          )
        )
        .where(
          and(
            eq(agendaEvents.agentId, user.id),
            gte(agendaEvents.scheduledAt, mskStart),
            lt(agendaEvents.scheduledAt, mskEnd),
            ne(agendaEvents.status, 'cancelled')
          )
        )
        .orderBy(asc(agendaEvents.scheduledAt));

      const staleClients = await db
        .select({
          id: clients.id,
          name: clients.name,
          updatedAt: clients.updatedAt,
        })
        .from(clients)
        .where(
          and(
            eq(clients.organizationId, user.organizationId),
            inArray(clients.status, ['active', 'thinking', 'negotiating']),
            lt(clients.updatedAt, staleBefore)
          )
        )
        .orderBy(asc(clients.updatedAt))
        .limit(3);

      const attention = staleClients.map((client) => ({
        id: client.id,
        name: client.name,
        reason: `давно без контакта (${daysSince(client.updatedAt, new Date())} дней)`,
      }));

      if (attention.length < 3) {
        const seenIds = new Set(attention.map((client) => client.id));
        const negotiatingClients = await db
          .select({
            id: clients.id,
            name: clients.name,
            updatedAt: clients.updatedAt,
          })
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, user.organizationId),
              eq(clients.status, 'negotiating')
            )
          )
          .orderBy(desc(clients.updatedAt))
          .limit(6);

        for (const client of negotiatingClients) {
          if (attention.length >= 3) break;
          if (seenIds.has(client.id)) continue;

          attention.push({
            id: client.id,
            name: client.name,
            reason: `переговоры в работе, нужен следующий шаг (${daysSince(
              client.updatedAt,
              new Date()
            )} дней с обновления)`,
          });
          seenIds.add(client.id);
        }
      }

      const agenda = agendaRows.map(({ e, clientName }) => ({
        time: formatMskTime(e.scheduledAt),
        type: e.eventType,
        title: e.address ? `${e.title}, ${e.address}` : e.title,
        clientName: clientName ?? undefined,
      }));

      const generated = await generateMorningBrief({
        agent_name: userBriefName(user, organization),
        today: formatMskDate(todayStr),
        agenda,
        attention: attention.map(({ name, reason }) => ({ name, reason })),
      });
      const text = sanitizeBriefText(generated.text.trim());

      if (!text || text.length < 20) {
        throw new Error(`Morning brief too short or empty: "${text.slice(0, 50)}"`);
      }

      const tts = await synthesize(text);
      const audioPath = await saveNarrativeAudio(narrativeId, tts.audio);

      await db
        .update(morningNarratives)
        .set({
          narrativeText: text,
          audioPath,
          audioDurationSec: Math.ceil(text.length / 18),
          status: 'ready',
          costUsd: String(tts.costUsd),
          generatedAt: new Date(),
        })
        .where(eq(morningNarratives.id, narrativeId));

      await sendPushToUser(user.id, {
        title: 'Утренний разбор',
        body: firstLine(text),
        url: `/agent?brief=${narrativeId}`,
      });

      results.push({ userId: user.id, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .update(morningNarratives)
        .set({ status: 'error', errorMessage: msg.slice(0, 500) })
        .where(eq(morningNarratives.id, narrativeId));
      results.push({ userId: user.id, ok: false, reason: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({
    ok: true,
    forDate: todayStr,
    usersChecked: activeUsers.length,
    skippedDayOff,
    skippedAlreadyReady,
    results,
  });
}
