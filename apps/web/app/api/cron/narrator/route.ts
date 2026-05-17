import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, users, morningNarratives, organizations } from '@estateos/db';
import { and, eq } from 'drizzle-orm';
import { collectDayStats } from '@/lib/narrator-stats';
import { generateMorningNarrative, synthesize } from '@estateos/ai';
import { saveNarrativeAudio } from '@/lib/audio-storage';
import { sendPushToUser } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isoYesterday(): { date: Date; dateStr: string } {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return { date: d, dateStr: d.toISOString().slice(0, 10) };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { date: yesterday, dateStr } = isoYesterday();
  const admins = await db
    .select({ u: users, o: organizations })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));

  const results: Array<{ adminId: string; ok: boolean; reason?: string }> = [];

  for (const { u: admin } of admins) {
    const [existing] = await db
      .select()
      .from(morningNarratives)
      .where(
        and(
          eq(morningNarratives.adminId, admin.id),
          eq(morningNarratives.periodDate, dateStr)
        )
      )
      .limit(1);
    if (existing && existing.status === 'ready') {
      results.push({ adminId: admin.id, ok: false, reason: 'already_ready' });
      continue;
    }

    const narrativeId = existing?.id ?? nanoid(16);
    try {
      if (!existing) {
        await db.insert(morningNarratives).values({
          id: narrativeId,
          organizationId: admin.organizationId,
          adminId: admin.id,
          periodDate: dateStr,
          status: 'generating',
        });
      } else {
        await db
          .update(morningNarratives)
          .set({ status: 'generating', errorMessage: null })
          .where(eq(morningNarratives.id, narrativeId));
      }

      const stats = await collectDayStats(admin.organizationId, yesterday);
      const gen = await generateMorningNarrative(stats);
      if (!gen.text || gen.text.length < 20) {
        throw new Error(`Narrative too short or empty: "${gen.text.slice(0, 50)}"`);
      }
      const tts = await synthesize(gen.text, 'nova', 'tts-1-hd');
      const audioPath = await saveNarrativeAudio(narrativeId, tts.audio);

      await db
        .update(morningNarratives)
        .set({
          narrativeText: gen.text,
          audioPath,
          audioDurationSec: Math.ceil(gen.text.length / 18),
          stats,
          status: 'ready',
          costUsd: String(gen.costUsd + tts.costUsd),
          generatedAt: new Date(),
        })
        .where(eq(morningNarratives.id, narrativeId));

      await sendPushToUser(admin.id, {
        title: 'Утренний разбор готов',
        body: `Послушай: вчера ${stats.showsYesterday} показ${stats.showsYesterday === 1 ? '' : stats.showsYesterday < 5 ? 'а' : 'ов'}.`,
        url: `/admin/narrator/${narrativeId}`,
      });
      results.push({ adminId: admin.id, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .update(morningNarratives)
        .set({ status: 'error', errorMessage: msg.slice(0, 500) })
        .where(eq(morningNarratives.id, narrativeId));
      results.push({ adminId: admin.id, ok: false, reason: msg.slice(0, 200) });
    }
  }

  return NextResponse.json({
    ok: true,
    forDate: dateStr,
    adminsChecked: admins.length,
    results,
  });
}
