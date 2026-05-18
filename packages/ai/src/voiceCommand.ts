import { llmChat, extractJSON } from './openrouter';
import { VOICE_COMMAND_SYSTEM, buildVoiceCommandUserPrompt } from './prompts/voiceCommand';

export type VoiceIntent = 'create_event' | 'search' | 'send_template' | 'generic';

export interface VoiceCommandResult {
  intent: VoiceIntent;
  confidence: number;
  payload: Record<string, unknown>;
}

export async function classifyVoiceCommand(
  transcript: string,
  current_screen: string,
): Promise<VoiceCommandResult | null> {
  const userPrompt = buildVoiceCommandUserPrompt(transcript, current_screen);
  const { text: raw } = await llmChat(VOICE_COMMAND_SYSTEM, userPrompt, {
    task: 'command',
    temperature: 0.2,
    maxTokens: 400,
    responseFormat: 'json_object',
  });
  return extractJSON<VoiceCommandResult>(raw);
}
