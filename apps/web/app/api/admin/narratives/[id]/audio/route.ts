import { NextRequest, NextResponse } from 'next/server';
import { db, morningNarratives } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { readNarrativeAudio } from '@/lib/audio-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const [row] = await db
    .select()
    .from(morningNarratives)
    .where(
      and(
        eq(morningNarratives.id, id),
        eq(morningNarratives.organizationId, admin.organizationId),
        eq(morningNarratives.adminId, admin.id)
      )
    )
    .limit(1);
  if (!row || !row.audioPath) {
    return NextResponse.json({ error: 'No audio' }, { status: 404 });
  }
  try {
    const audio = await readNarrativeAudio(row.audioPath);
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.length),
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Audio file missing' }, { status: 404 });
  }
}
