import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI {
  if (_client) return _client;
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required');
  }
  _client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://estateos.ru',
      'X-Title': 'EstateOS',
    },
  });
  return _client;
}

// Backward-compat alias for internal usage in this module.
const getClient = getOpenRouterClient;

// kimi-k2 via Novita (supports structured-ish output via prompting)
const KIMI_MODEL = 'moonshotai/kimi-k2';

export async function kimiChat(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const client = getClient();
  // Pin provider to Novita (kimi-k2 quirk, see hq memory).
  // OpenRouter accepts `provider` at top-level via OpenAI SDK loose-body cast.
  const res = await client.chat.completions.create({
    model: KIMI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1024,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: { order: ['novita'] },
  } as never);
  return res.choices[0]?.message?.content ?? '';
}

export function extractJSON<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const match = candidate.match(/[{[][\s\S]*[}\]]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
