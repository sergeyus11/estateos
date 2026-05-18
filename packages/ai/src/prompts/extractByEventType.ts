export const EXTRACT_PROMPTS: Record<'showing' | 'meeting' | 'call' | 'task', string> = {
  showing: `Извлеки из расшифровки показа недвижимости 5 полей:
- object: что показывали (адрес, тип квартиры/коммерции)
- client: имя клиента
- budget: бюджет (диапазон или сумма)
- reaction: реакция клиента (позитив/нейтрально/отказ)
- nextStep: следующий шаг
Если поле не упомянуто — null. Формат: JSON {object, client, budget, reaction, nextStep}.`,

  meeting: `Извлеки из расшифровки встречи 3 поля:
- topic: тема встречи
- decisions: что договорились
- nextStep: следующий шаг
Формат: JSON {topic, decisions, nextStep}.`,

  call: `Извлеки из расшифровки звонка 2 поля:
- topic: о чём был разговор
- result: результат
Формат: JSON {topic, result}.`,

  task: `Извлеки из расшифровки задачи 2 поля:
- summary: что сделано или что нужно
- followUp: нужен ли follow-up (true/false) и какой
Формат: JSON {summary, followUp}.`,
};
