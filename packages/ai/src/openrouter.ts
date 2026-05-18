import OpenAI from 'openai';
import { getProxyAgent } from './httpAgent';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

let _client: OpenAI | null = null;
export function getOpenRouterClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required');
  _client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      'HTTP-Referer': 'https://estateos.ru',
      'X-Title': 'EstateOS',
    },
    httpAgent: getProxyAgent(),
  });
  return _client;
}

export type LLMTask = 'extract' | 'parse' | 'brief' | 'summarize' | 'command';

/**
 * Resolve model name from env, with task-specific overrides.
 * Defaults preserve backward compat (moonshotai/kimi-k2 everywhere).
 */
export function getModelForTask(task: LLMTask): string {
  const defaults: Record<LLMTask, string> = {
    extract: 'moonshotai/kimi-k2',
    parse: 'moonshotai/kimi-k2',
    brief: 'moonshotai/kimi-k2',
    summarize: 'moonshotai/kimi-k2',
    command: 'moonshotai/kimi-k2',
  };
  const generalOverride = process.env.LLM_MODEL;
  const taskOverride: Partial<Record<LLMTask, string | undefined>> = {
    extract: process.env.LLM_MODEL_EXTRACT,
    parse: process.env.LLM_MODEL_PARSE,
    brief: process.env.LLM_MODEL_BRIEF,
    summarize: process.env.LLM_MODEL_SUMMARIZE,
    command: process.env.LLM_MODEL_COMMAND,
  };
  return taskOverride[task] ?? generalOverride ?? defaults[task];
}

function needsNovitaPin(model: string): boolean {
  return model.startsWith('moonshotai/');
}

export interface LLMChatOptions {
  model?: string;
  task?: LLMTask;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}

/**
 * Universal chat completion. Pass either `model` or `task` (task is resolved via getModelForTask).
 */
export async function llmChat(
  systemPrompt: string,
  userPrompt: string,
  opts: LLMChatOptions = {},
): Promise<string> {
  const model = opts.model ?? getModelForTask(opts.task ?? 'extract');
  const client = getOpenRouterClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1500,
  };
  if (needsNovitaPin(model)) {
    body.provider = { order: ['novita'] };
  }
  if (opts.responseFormat === 'json_object' && !needsNovitaPin(model)) {
    // kimi-k2 does not support json_object — only gemini/openai
    body.response_format = { type: 'json_object' };
  }
  const res = await client.chat.completions.create(body as never);
  return res.choices[0]?.message?.content ?? '';
}

/**
 * Back-compat shim: old callsites use kimiChat → redirect to llmChat(task='extract').
 */
export async function kimiChat(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  return llmChat(systemPrompt, userPrompt, { ...opts, task: 'extract' });
}

/**
 * Extract JSON from LLM output. Handles fenced ```json ... ``` blocks and bare JSON.
 */
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
