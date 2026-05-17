import OpenAI from 'openai';
import { getProxyAgent } from './httpAgent';

let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (_openai) return _openai;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required');
  }
  _openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: getProxyAgent(),
  });
  return _openai;
}

/* ============================================================
 *  Provider-agnostic TTS — OpenAI + ElevenLabs
 * ============================================================ */

export type OpenAIVoice = 'alloy' | 'nova' | 'onyx' | 'shimmer' | 'echo' | 'fable';
export type OpenAITtsModel = 'tts-1' | 'tts-1-hd';

/**
 * Premade ElevenLabs voices, optimal для русского narrative.
 * Все доступны на любом tier (включая free).
 */
export const ELEVEN_VOICES = {
  charlotte: 'XB0fDUnXU5powFXDhCwa', // British female, тёплая, подкаст-стиль
  sarah:     'EXAVITQu4vr4xnSDxMAH', // Soft female, energy-driven
  alice:     'Xb7hH8MSUJpSbSDYk0k2', // Professional female, news-anchor
  george:    'JBFqnCBsd6RMkjVDRZzb', // Mature male, gravitas
  brian:     'nPczCjzI2devNBz1zQrb', // Deep male, conversational
} as const;
export type ElevenVoice = keyof typeof ELEVEN_VOICES;

export type ElevenModel =
  | 'eleven_multilingual_v2' // best quality
  | 'eleven_turbo_v2_5'      // 2× faster, ~same quality
  | 'eleven_flash_v2_5';     // fastest, 50% cheaper

export type TTSResult = {
  audio: Buffer;
  contentType: string;
  costUsd: number;
  latencyMs: number;
  provider: 'openai' | 'elevenlabs';
  voice: string;
  model: string;
};

/* ===== OpenAI TTS ===== */

export async function synthesizeOpenAI(
  text: string,
  voice: OpenAIVoice = 'nova',
  model: OpenAITtsModel = 'tts-1-hd'
): Promise<TTSResult> {
  const start = Date.now();
  const openai = getOpenAIClient();
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
    provider: 'openai',
    voice,
    model,
  };
}

/* ===== ElevenLabs TTS ===== */

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

/** Approximate cost / character per model (USD).
 *  Source: ElevenLabs pricing docs 2025.
 *  Real billing — credits, не доллары; это proxy для cost tracking.
 */
function elevenCharCost(model: ElevenModel): number {
  switch (model) {
    case 'eleven_multilingual_v2': return 0.00018; // ~$0.18 / 1k chars
    case 'eleven_turbo_v2_5':      return 0.00009; // ~$0.09 / 1k chars
    case 'eleven_flash_v2_5':      return 0.00005; // ~$0.05 / 1k chars
  }
}

export async function synthesizeEleven(
  text: string,
  voice: ElevenVoice = 'charlotte',
  model: ElevenModel = 'eleven_multilingual_v2',
  voiceSettings: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  } = {}
): Promise<TTSResult> {
  const start = Date.now();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required');

  const voiceId = ELEVEN_VOICES[voice];
  // ElevenLabs geo-блокирует РФ. ELEVENLABS_HTTPS_PROXY = отдельный EU-proxy,
  // не использовать общий xray (его IP всё равно русский).
  const elevenProxyUrl =
    process.env.ELEVENLABS_HTTPS_PROXY ||
    process.env.elevenlabs_https_proxy;
  let proxy: ReturnType<typeof getProxyAgent>;
  if (elevenProxyUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { HttpsProxyAgent } = require('https-proxy-agent');
    proxy = new HttpsProxyAgent(elevenProxyUrl);
  } else {
    proxy = getProxyAgent();
  }

  const body = {
    text,
    model_id: model,
    voice_settings: {
      stability: voiceSettings.stability ?? 0.5,
      similarity_boost: voiceSettings.similarity_boost ?? 0.75,
      style: voiceSettings.style ?? 0.0,
      use_speaker_boost: voiceSettings.use_speaker_boost ?? true,
    },
  };

  // Node-fetch с прокси: используем undici или axios для proxy support.
  // ElevenLabs из РФ blocked — proxy обязателен.
  // Используем node:https напрямую через HttpsProxyAgent.
  const httpsMod = await import('node:https');
  const url = new URL(`${ELEVEN_BASE}/text-to-speech/${voiceId}`);

  const audio = await new Promise<Buffer>((resolve, reject) => {
    const req = httpsMod.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + url.search,
        agent: proxy,
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            reject(
              new Error(
                `ElevenLabs HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf-8').slice(0, 300)}`
              )
            );
          });
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });

  return {
    audio,
    contentType: 'audio/mpeg',
    costUsd: text.length * elevenCharCost(model),
    latencyMs: Date.now() - start,
    provider: 'elevenlabs',
    voice,
    model,
  };
}

/* ===== Unified entry point with provider auto-select ===== */

/**
 * Provider-aware synthesize.
 * - Если TTS_PROVIDER=elevenlabs и ELEVENLABS_API_KEY есть → ElevenLabs Charlotte multilingual_v2
 * - Иначе → OpenAI nova tts-1-hd (back-compat default)
 */
export async function synthesize(
  text: string,
  legacyVoice: OpenAIVoice = 'nova',
  legacyModel: OpenAITtsModel = 'tts-1-hd'
): Promise<TTSResult> {
  const provider = process.env.TTS_PROVIDER?.toLowerCase();
  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    const voice = (process.env.TTS_ELEVEN_VOICE as ElevenVoice) || 'charlotte';
    const model = (process.env.TTS_ELEVEN_MODEL as ElevenModel) || 'eleven_multilingual_v2';
    return synthesizeEleven(text, voice, model);
  }
  return synthesizeOpenAI(text, legacyVoice, legacyModel);
}

// Legacy export alias для apps/web/lib/audio-storage callers
export type Voice = OpenAIVoice;
export type TtsModel = OpenAITtsModel;
