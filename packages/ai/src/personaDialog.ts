import { kimiChat } from './openrouter';
import type { TrainingTurn } from '@estateos/db';

export async function generatePersonaOpener(systemPrompt: string): Promise<string> {
  return kimiChat(
    systemPrompt,
    'Начни диалог: ты только что вошёл/вошла к агенту в офис (или агент тебе позвонил). Скажи 1-2 предложения как клиент, который пришёл смотреть варианты.',
    { temperature: 0.7, maxTokens: 200 }
  );
}

export async function generatePersonaReply(
  systemPrompt: string,
  history: TrainingTurn[],
  agentLatest: string
): Promise<string> {
  const transcript = history
    .map((t) => `${t.role === 'agent' ? 'АГЕНТ' : 'ТЫ'}: ${t.text}`)
    .join('\n');

  const userPrompt = `История диалога:
${transcript}

Последняя реплика агента: "${agentLatest}"

Ответь как клиент по своей легенде (1-3 предложения).`;

  return kimiChat(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 250 });
}

export function shouldEnd(turn: string): boolean {
  const lower = turn.toLowerCase();
  return /до\s+свидан|прощайте|хорошего дня|спасибо.*пока|удачи/.test(lower);
}
