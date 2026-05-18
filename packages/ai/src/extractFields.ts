import { llmChat, extractJSON } from './openrouter';

export type ReportFields = {
  object: string | null;
  client: string | null;
  budget: string | null;
  reaction: string | null;
  nextStep: string | null;
};

export type ExtractionResult = {
  fields: ReportFields;
  missing: Array<keyof ReportFields>;
};

const SYSTEM_PROMPT = `Ты — AI-ассистент для агентств недвижимости. Извлекай из расшифровки голосового отчёта агента после показа квартиры строго 5 полей в JSON:

{
  "object": "название ЖК / адрес / тип объекта (3-комн в центре, ЖК Времена года, ...)",
  "client": "имя клиента + телефон если назвал (Анна +79161234567, ...) или null",
  "budget": "сумма или диапазон (2.5М, 3-4М, до 5М, ...) или null если не сказал",
  "reaction": "тёплый/холодный/возражения/коммент",
  "nextStep": "дата + действие + кто инициирует (показ в субботу — Иван перезвонит)"
}

Поле null если агент не упомянул это явно.

Верни ТОЛЬКО валидный JSON, без префиксов и комментариев.`;

export async function extractFields(transcript: string): Promise<ExtractionResult> {
  const raw = await llmChat(SYSTEM_PROMPT, `Расшифровка:\n${transcript}`, {
    task: 'extract',
    temperature: 0.2,
    maxTokens: 500,
  });
  const parsed = extractJSON<ReportFields>(raw);
  const fields: ReportFields = {
    object: parsed?.object ?? null,
    client: parsed?.client ?? null,
    budget: parsed?.budget ?? null,
    reaction: parsed?.reaction ?? null,
    nextStep: parsed?.nextStep ?? null,
  };
  const missing = (Object.keys(fields) as Array<keyof ReportFields>).filter(
    (k) => fields[k] === null || fields[k] === ''
  );
  return { fields, missing };
}
