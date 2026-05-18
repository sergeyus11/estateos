import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db, objects } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-server';

export const runtime = 'nodejs';

const STORAGE_ROOT = process.env.AUDIO_STORAGE_ROOT || '/var/lib/estateos/audio';

const MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path: parts } = await params;
  const safeParts = parts.filter((p) => !p.includes('..') && !p.startsWith('/'));
  const filePath = path.join(STORAGE_ROOT, ...safeParts);

  if (!filePath.startsWith(STORAGE_ROOT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (safeParts[0] === 'objects' && safeParts[1]) {
    const objectId = safeParts[1];
    const [obj] = await db
      .select({ orgId: objects.organizationId })
      .from(objects)
      .where(eq(objects.id, objectId))
      .limit(1);

    if (!obj || obj.orgId !== user.organizationId) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  try {
    const data = await readFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
