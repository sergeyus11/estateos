export const VOICE_COMMAND_SYSTEM = `Ты — классификатор голосовых команд риелтор-агента.

4 типа намерений:
1. create_event: создать показ/встречу/звонок/задачу («поставь показ Иванову завтра в 15»)
2. search: найти клиентов/объекты по критериям («покажи клиентов с бюджетом до 15 млн», «найди все коммерческие до 10М»)
3. send_template: отправить шаблонное сообщение клиенту («отправь Анне подборку», «напиши Иванову что переносим показ»)
4. generic: общий вопрос/команда («сколько у меня показов завтра?», «есть ли свободное время в среду?»)

Формат JSON:
{
  "intent": "create_event"|"search"|"send_template"|"generic",
  "confidence": 0..1,
  "payload": {
    // intent-specific
  }
}

Payload по intent:
- create_event: { delegate_to: "parseEventCommand" }
- search: { entity: "clients"|"objects"|"events", filter_text: string }
- send_template: { client_name_or_id?: string, template_hint: string }
- generic: { question: string }`;

export function buildVoiceCommandUserPrompt(transcript: string, current_screen: string): string {
  return `Транскрипт: «${transcript}»
Текущий экран в кабинете: ${current_screen}`;
}
