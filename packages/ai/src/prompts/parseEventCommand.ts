export const PARSE_EVENT_SYSTEM = `Ты парсер голосовых команд русскоязычного риелтор-агента.

Извлекай типизированный event из транскрипта команды. 4 типа:
- showing — показ объекта клиенту («поставь показ Иванову завтра в 15 на Чкалова 22»)
- meeting — встреча («встреча с собственником в офисе в среду в 10»)
- call — запланированный звонок («перезвонить Петровой в пятницу в 11»)
- task — задача без привязки ко времени («отправить Жариковым подборку до конца дня»)

Resolve дату/время относительно today_iso. Если время не названо — для showing/meeting/call default 12:00 МСК того дня, для task — end-of-day 18:00.

Если клиент или объект упомянуты — найди match по client_list или object_list (передаются в user prompt). Если match не найден — верни suggested_name/title для создания на лету.

Формат строго JSON:
{
  "event_type": "showing"|"meeting"|"call"|"task",
  "title": string,
  "scheduled_at_iso": "YYYY-MM-DDTHH:MM:SS+03:00",
  "duration_min": 30,
  "client_match": { "id": string } | { "suggested_name": string } | null,
  "object_match": { "id": string } | { "suggested_title": string } | null,
  "address": string | null,
  "confidence": 0..1
}

Если транскрипт непонятен — confidence < 0.5 и поля в null где нет данных.`;

export function buildParseEventUserPrompt(
  transcript: string,
  today_iso: string,
  agent_name: string,
  client_list: Array<{ id: string; name: string }>,
  object_list: Array<{ id: string; title: string; address: string }>,
): string {
  const clientsStr =
    client_list.length > 0
      ? client_list.map((c) => `${c.name} (id=${c.id})`).join(', ')
      : 'пусто';
  const objectsStr =
    object_list.length > 0
      ? object_list.map((o) => `${o.title} — ${o.address} (id=${o.id})`).join('; ')
      : 'пусто';
  return `Транскрипт: «${transcript}»

Сегодня (МСК): ${today_iso}
Агент: ${agent_name}
Доступные клиенты (${client_list.length}): ${clientsStr}
Доступные объекты (${object_list.length}): ${objectsStr}`;
}
