import { createClient } from '@deepgram/sdk';

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY is required');
  }
  _client = createClient(process.env.DEEPGRAM_API_KEY);
  return _client;
}

export type TranscribeResult = {
  transcript: string;
  durationMs: number;
};

const DEEPGRAM_TIMEOUT_MS = 35_000;
const MAX_RETRIES = 1;

export async function transcribe(
  audio: Buffer,
  _mimeType = 'audio/webm'
): Promise<TranscribeResult> {
  const start = Date.now();
  const dg = getClient();
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    try {
      const { result, error } = await Promise.race([
        dg.listen.prerecorded.transcribeFile(audio, {
          model: 'nova-3',
          language: 'ru',
          punctuate: true,
          smart_format: true,
        }),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(
            () => reject(new Error('Deepgram timeout')),
            DEEPGRAM_TIMEOUT_MS
          );
        }),
      ]);
      if (error) throw new Error(`Deepgram: ${error.message}`);
      const transcript =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
      return { transcript, durationMs: Date.now() - start };
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        console.warn(`[deepgram] attempt ${attempt + 1} failed, retrying...`, e);
      }
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  }

  throw lastErr;
}
