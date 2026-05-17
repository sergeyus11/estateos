import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';

const STORAGE_ROOT = process.env.AUDIO_STORAGE_ROOT || '/var/lib/estateos/audio';

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
