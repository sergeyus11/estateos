import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (_openai) return _openai;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required');
  }
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export type Voice = 'alloy' | 'nova' | 'onyx' | 'shimmer' | 'echo' | 'fable';
export type TtsModel = 'tts-1' | 'tts-1-hd';

export type TTSResult = {
  audio: Buffer;
  contentType: string;
  costUsd: number;
  latencyMs: number;
};

export async function synthesize(
  text: string,
  voice: Voice = 'nova',
  model: TtsModel = 'tts-1-hd'
): Promise<TTSResult> {
  const start = Date.now();
  const openai = getClient();
  const res = await openai.audio.speech.create({
    model,
    voice,
    input: text,
    response_format: 'mp3',
  });
  const audio = Buffer.from(await res.arrayBuffer());
  const chars = text.length;
  const costUsd =
    model === 'tts-1-hd' ? (chars / 1000) * 0.030 : (chars / 1000) * 0.015;
  return {
    audio,
    contentType: 'audio/mpeg',
    costUsd,
    latencyMs: Date.now() - start,
  };
}
