import { llmChat } from './openrouter';
import { MORNING_BRIEF_SYSTEM, buildMorningBriefPrompt } from './prompts/morningBrief';

export interface MorningBriefInput {
  agent_name: string;
  today: string;
  agenda: Array<{ time: string; type: string; title: string; clientName?: string }>;
  attention: Array<{ name: string; reason: string }>;
}

export async function generateMorningBrief(input: MorningBriefInput): Promise<{ text: string; model: string }> {
  const userPrompt = buildMorningBriefPrompt(input.agent_name, input.today, input.agenda, input.attention);
  const { text, model } = await llmChat(MORNING_BRIEF_SYSTEM, userPrompt, {
    task: 'brief',
    temperature: 0.7,
    maxTokens: 1500,
  });
  return { text, model };
}
