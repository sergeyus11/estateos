export const SUMMARIZE_CLIENT_SYSTEM = `Ты пишешь TL;DR клиента для риелтор-агентства.

Правила:
- 2-4 предложения, без воды, по делу
- Конкретно: бюджет, что искал, на что отреагировал, в какой стадии
- Если клиент готов к авансу/сделке — отметь явно («готов к авансу»)
- Если есть risk-flag (давно молчит, изменил позицию, отказался от нескольких объектов) — отметь
- Никаких эмодзи
- Никакого слова «партнёр»
- Используй именительный падеж имени клиента, не «клиент Иван»

Также верни:
- pref_chips: 3-5 коротких тегов того что клиент хочет (например: «паркинг», «не 1 этаж», «бюджет 14М», «ипотека одобрена»)
- next_step_suggestion: 1 короткое предложение (50-100 chars) о следующем шаге

Формат: строго JSON
{
  "summary": "...",
  "pref_chips": ["...", "..."],
  "next_step_suggestion": "..."
}`;

export function buildSummarizeClientUserPrompt(
  client: {
    name: string;
    budgetMin: string | null;
    budgetMax: string | null;
    status: string;
    preferences: string[];
  },
  events: Array<{
    eventType: string;
    scheduledAt: Date;
    title: string;
    transcript?: string;
    fields?: Record<string, unknown>;
  }>,
): string {
  const eventLines = events
    .map((e, i) => {
      const dt = e.scheduledAt.toISOString().slice(0, 10);
      const f = e.fields ?? {};
      const fStr = Object.entries(f)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      const tr = e.transcript ? ` · «${e.transcript.slice(0, 200)}»` : '';
      return `${i + 1}. [${dt}] ${e.eventType}: ${e.title}${fStr ? ' | ' + fStr : ''}${tr}`;
    })
    .join('\n');

  const budget =
    client.budgetMin || client.budgetMax
      ? `${client.budgetMin ?? '?'}-${client.budgetMax ?? '?'}`
      : 'не указан';

  return `Клиент: ${client.name}
Текущий статус: ${client.status}
Бюджет: ${budget}
Известные предпочтения: ${(client.preferences ?? []).join(', ') || 'нет'}

События (${events.length}):
${eventLines || 'нет событий'}`;
}
