import { llmChat, extractJSON } from './openrouter';
import { PARSE_EVENT_SYSTEM, buildParseEventUserPrompt } from './prompts/parseEventCommand';

export interface ParsedEvent {
  event_type: 'showing' | 'meeting' | 'call' | 'task';
  title: string;
  scheduled_at_iso: string;
  duration_min: number;
  client_match: { id: string } | { suggested_name: string } | null;
  object_match: { id: string } | { suggested_title: string } | null;
  address: string | null;
  confidence: number;
}

export interface ParseEventInput {
  transcript: string;
  today_iso: string;
  agent_name: string;
  client_list: Array<{ id: string; name: string }>;
  object_list: Array<{ id: string; title: string; address: string }>;
}

export async function parseEventCommand(input: ParseEventInput): Promise<ParsedEvent | null> {
  const userPrompt = buildParseEventUserPrompt(
    input.transcript,
    input.today_iso,
    input.agent_name,
    input.client_list,
    input.object_list
  );
  const { text: raw } = await llmChat(PARSE_EVENT_SYSTEM, userPrompt, {
    task: 'parse',
    temperature: 0.2,
    maxTokens: 500,
    responseFormat: 'json_object',
  });
  return extractJSON<ParsedEvent>(raw);
}
