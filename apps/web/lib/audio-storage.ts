import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { nanoid } from 'nanoid';

const STORAGE_ROOT = process.env.AUDIO_STORAGE_ROOT || '/var/lib/estateos/audio';

const PHOTO_EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function saveAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const id = nanoid(16);
  const ext = mimeType.includes('webm')
    ? 'webm'
    : mimeType.includes('mp4')
    ? 'm4a'
    : mimeType.includes('ogg')
    ? 'ogg'
    : 'audio';
  const today = new Date().toISOString().slice(0, 10);
  const dir = path.join(STORAGE_ROOT, today);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.${ext}`);
  await writeFile(filePath, buffer);
  return `/audio/${today}/${id}.${ext}`;
}

export async function saveNarrativeAudio(narrativeId: string, audio: Buffer): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(STORAGE_ROOT, 'narratives', date);
  await mkdir(dir, { recursive: true });
  const filename = `${narrativeId}.mp3`;
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, audio);
  return path.relative(STORAGE_ROOT, fullPath);
}

export async function readNarrativeAudio(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  return readFile(fullPath);
}

export async function saveObjectPhoto(
  buf: Buffer,
  objectId: string,
  mime: string
): Promise<string> {
  const root = process.env.AUDIO_STORAGE_ROOT ?? STORAGE_ROOT;
  const dir = path.join('objects', objectId);
  const ext = PHOTO_EXT_BY_MIME[mime] ?? 'jpg';
  const filename = `${Date.now()}_${randomBytes(6).toString('hex')}.${ext}`;
  await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, dir, filename), buf);
  return `/audio/objects/${objectId}/${filename}`;
}
