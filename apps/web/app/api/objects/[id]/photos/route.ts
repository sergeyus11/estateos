import { NextRequest, NextResponse } from 'next/server';
import { db, objects } from '@estateos/db';
import { and, eq } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { saveObjectPhoto } from '@/lib/audio-storage';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTOS_PER_OBJECT = 10;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const file = form.get('photo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'photo file required' }, { status: 400 });
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Failed to read upload' }, { status: 400 });
  }

  const { id } = await params;
  const [object] = await db
    .select()
    .from(objects)
    .where(
      and(
        eq(objects.id, id),
        eq(objects.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!object) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const currentPhotos = Array.isArray(object.photos) ? (object.photos as string[]) : [];
  if (currentPhotos.length >= MAX_PHOTOS_PER_OBJECT) {
    return NextResponse.json({ error: 'Max 10 photos' }, { status: 400 });
  }

  let url: string;
  try {
    url = await saveObjectPhoto(buffer, id, file.type);
  } catch (e) {
    console.error('[photos] saveObjectPhoto failed', e);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }

  const photos = [...currentPhotos, url];
  await db
    .update(objects)
    .set({ photos, updatedAt: new Date() })
    .where(and(eq(objects.id, id), eq(objects.organizationId, user.organizationId)));

  return NextResponse.json({ url, photos });
}
