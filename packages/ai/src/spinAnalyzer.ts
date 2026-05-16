import { kimiChat, extractJSON } from './openrouter';
import type { TrainingTurn, SpinAnalysis } from '@estateos/db';

const SPIN_SYSTEM = `Ты — наставник по продажам с экспертизой в SPIN-методологии. Анализируешь учебный диалог агента недвижимости с клиентом.

SPIN — четыре типа вопросов агента:
1. Situation — выяснить ситуацию клиента (где живёт, состав семьи, причина покупки)
2. Problem — выявить проблемы (что не устраивает в текущем жилье)
3. Implication — раскрыть последствия проблем (что будет, если не решить)
4. Need-payoff — показать ценность решения (как улучшится жизнь после покупки)

Анализируй ТОЛЬКО реплики агента (роль АГЕНТ). Возвращай JSON:

{
  "situation": <число ситуационных вопросов: 0-10>,
  "problem": <число проблемных вопросов: 0-10>,
  "implication": <число извлекающих вопросов: 0-10>,
  "needPayoff": <число направляющих вопросов: 0-10>,
  "score": <общая оценка 1-10 (баланс категорий + сила переходов)>,
  "feedback": "2-4 предложения с конкретными рекомендациями: что сделал хорошо, что упустил, что сказать в похожей ситуации в следующий раз"
}

Верни ТОЛЬКО JSON.`;

export async function analyzeSpin(
  transcript: TrainingTurn[]
): Promise<SpinAnalysis> {
  const dialog = transcript
    .map((t) => `${t.role === 'agent' ? 'АГЕНТ' : 'КЛИЕНТ'}: ${t.text}`)
    .join('\n');

  const userPrompt = `Диалог:

${dialog}

Проанализируй по SPIN и верни JSON.`;

  const raw = await kimiChat(SPIN_SYSTEM, userPrompt, {
    temperature: 0.2,
    maxTokens: 600,
  });

  const parsed = extractJSON<SpinAnalysis>(raw);
  if (!parsed) {
    return {
      situation: 0,
      problem: 0,
      implication: 0,
      needPayoff: 0,
      score: 0,
      feedback: 'Не удалось проанализировать диалог. Попробуй провести сессию ещё раз.',
    };
  }

  return {
    situation: Math.max(0, Math.min(10, parsed.situation || 0)),
    problem: Math.max(0, Math.min(10, parsed.problem || 0)),
    implication: Math.max(0, Math.min(10, parsed.implication || 0)),
    needPayoff: Math.max(0, Math.min(10, parsed.needPayoff || 0)),
    score: Math.max(0, Math.min(10, parsed.score || 0)),
    feedback: parsed.feedback || '',
  };
}
