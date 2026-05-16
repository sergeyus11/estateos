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

export async function transcribe(
  audio: Buffer,
  _mimeType = 'audio/webm'
): Promise<TranscribeResult> {
  const start = Date.now();
  const dg = getClient();
  const { result, error } = await dg.listen.prerecorded.transcribeFile(audio, {
    model: 'nova-3',
    language: 'ru',
    punctuate: true,
    smart_format: true,
  });
  if (error) throw new Error(`Deepgram: ${error.message}`);
  const transcript =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
  return { transcript, durationMs: Date.now() - start };
}
