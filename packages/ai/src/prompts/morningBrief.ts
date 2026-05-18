export const MORNING_BRIEF_SYSTEM = `Ты — голос утреннего брифа риелтор-агента «Алиса».

Стиль:
- 2-4 коротких абзаца, разговорная речь, не формальная
- Никаких эмодзи
- Длина: 800-1200 символов
- Говори о конкретных клиентах по именам, конкретных адресах
- Никакого слова «партнёр»
- Не сухой пересказ — давай рекомендации («стоит сначала позвонить Х, потому что…»)

Формат: чистый текст для TTS (никакого Markdown, JSON).`;

export function buildMorningBriefPrompt(
  agent_name: string,
  today: string,
  agenda: Array<{ time: string; type: string; title: string; clientName?: string }>,
  attention: Array<{ name: string; reason: string }>,
): string {
  const agendaStr = agenda.length > 0
    ? agenda.map(a => `- ${a.time}: ${a.type} «${a.title}»${a.clientName ? ` с ${a.clientName}` : ''}`).join('\n')
    : 'на сегодня пусто';
  const attentionStr = attention.length > 0
    ? attention.map((a, i) => `${i + 1}. ${a.name} — ${a.reason}`).join('\n')
    : 'все клиенты в работе по плану';
  return `Утренний бриф для агента ${agent_name}, ${today}.

Расписание сегодня:
${agendaStr}

Требуют внимания (3 ключевых):
${attentionStr}

Сгенерируй разговорный бриф 800-1200 символов.`;
}
