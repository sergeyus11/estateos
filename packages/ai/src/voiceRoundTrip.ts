import { llmChat, extractJSON } from './openrouter';
import type { ReportFields } from './extractFields';

const ROUNDTRIP_SYSTEM = `Ты — AI-помощник, который задаёт ОДИН уточняющий голосовой вопрос агенту, если в его отчёте о показе не хватает данных. Вопрос короткий (1-2 предложения), на ты, дружелюбный.`;

const LABELS: Record<keyof ReportFields, string> = {
  object: 'объект (ЖК или адрес)',
  client: 'имя клиента или его телефон',
  budget: 'бюджет клиента',
  reaction: 'реакцию клиента',
  nextStep: 'следующий шаг',
};

export async function generateFollowUpQuestion(
  fields: ReportFields,
  missing: Array<keyof ReportFields>
): Promise<string> {
  const missingLabels = missing.map((m) => LABELS[m]).join(', ');

  const userPrompt = `Известное:
${JSON.stringify(fields, null, 2)}

Не хватает: ${missingLabels}

Задай один короткий вопрос чтобы дополнить недостающее.`;

  const { text } = await llmChat(ROUNDTRIP_SYSTEM, userPrompt, { task: 'extract', temperature: 0.5, maxTokens: 200 });
  return text;
}

const MERGE_SYSTEM = `Ты дополняешь поля отчёта о показе квартиры новым ответом агента. Возвращай 5 полей в JSON: object, client, budget, reaction, nextStep. Если новый ответ не содержит инфы для поля — оставь старое значение.`;

export async function mergeAnswer(
  previousFields: ReportFields,
  question: string,
  newAnswerTranscript: string
): Promise<ReportFields> {
  const userPrompt = `Текущие поля:
${JSON.stringify(previousFields, null, 2)}

Вопрос, который задал AI: "${question}"
Ответ агента: "${newAnswerTranscript}"

Верни обновлённые 5 полей в JSON.`;

  const { text: raw } = await llmChat(MERGE_SYSTEM, userPrompt, { task: 'extract', temperature: 0.2 });
  const parsed = extractJSON<ReportFields>(raw);
  return {
    object: parsed?.object ?? previousFields.object,
    client: parsed?.client ?? previousFields.client,
    budget: parsed?.budget ?? previousFields.budget,
    reaction: parsed?.reaction ?? previousFields.reaction,
    nextStep: parsed?.nextStep ?? previousFields.nextStep,
  };
}
