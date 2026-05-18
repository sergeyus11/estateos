import { llmChat, extractJSON } from './openrouter';
import {
  SUMMARIZE_CLIENT_SYSTEM,
  buildSummarizeClientUserPrompt,
} from './prompts/summarizeClient';

export interface SummarizeClientInput {
  name: string;
  budgetMin: string | null;
  budgetMax: string | null;
  status: string;
  preferences: string[];
}

export interface SummarizeClientEvent {
  eventType: string;
  scheduledAt: Date;
  title: string;
  transcript?: string;
  fields?: Record<string, unknown>;
}

export interface SummarizeClientResult {
  summary: string;
  pref_chips: string[];
  next_step_suggestion: string;
}

export async function summarizeClient(
  client: SummarizeClientInput,
  events: SummarizeClientEvent[],
): Promise<SummarizeClientResult> {
  if (events.length === 0) {
    return {
      summary: `${client.name} — новый клиент, событий пока нет.`,
      pref_chips: [],
      next_step_suggestion: 'Назначь первый показ или встречу.',
    };
  }

  const userPrompt = buildSummarizeClientUserPrompt(client, events);
  const { text: raw } = await llmChat(SUMMARIZE_CLIENT_SYSTEM, userPrompt, {
    task: 'summarize',
    temperature: 0.3,
    maxTokens: 600,
    responseFormat: 'json_object',
  });
  const parsed = extractJSON<SummarizeClientResult>(raw);

  if (!parsed || !parsed.summary) {
    return {
      summary: `${client.name} — резюме не сгенерировано (LLM error). События: ${events.length}.`,
      pref_chips: client.preferences ?? [],
      next_step_suggestion: 'Свяжись с клиентом по последнему событию.',
    };
  }

  return {
    summary: parsed.summary,
    pref_chips: Array.isArray(parsed.pref_chips)
      ? parsed.pref_chips.slice(0, 5)
      : [],
    next_step_suggestion: parsed.next_step_suggestion ?? '',
  };
}
