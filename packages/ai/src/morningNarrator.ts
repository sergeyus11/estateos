import { getOpenRouterClient } from './openrouter';

export type NarratorStats = {
  showsToday: number;
  showsYesterday: number;
  weekTotal: number;
  activeAgents: number;
  topAgent: { name: string; count: number } | null;
  topObject: string | null;
  hotProspects: Array<{ object: string; client: string; reaction: string }>;
};

export function buildNarratorPrompt(stats: NarratorStats): string {
  const hot =
    stats.hotProspects.length > 0
      ? stats.hotProspects
          .map((p) => `- ${p.client} по объекту "${p.object}": «${p.reaction}»`)
          .join('\n')
      : '(горячих клиентов нет)';
  const top = stats.topAgent
    ? `${stats.topAgent.name} (${stats.topAgent.count} показов)`
    : 'никто не выделился';
  const emptyHint =
    stats.showsYesterday === 0
      ? 'Вчера было пусто — это бывает, не драматизируй, скажи спокойно.'
      : '';

  return `Ты — утренний голос Сусанны, главы агентства недвижимости. Каждое утро в 09:30 ты пересказываешь её вчерашний день за 45–75 секунд (≈110–180 слов). Тон: спокойный, тёплый, по делу, без эмодзи, без приветствий вроде «Доброе утро, дорогая». Пиши сплошным текстом, естественной речью, без bullet-points и заголовков.

Сводка за вчера:
- Показов за вчера: ${stats.showsYesterday}
- Показов за неделю: ${stats.weekTotal}
- Сегодня уже записано: ${stats.showsToday}
- Активных агентов: ${stats.activeAgents}
- Лидер вчера: ${top}
- Чаще всего показывали: ${stats.topObject ?? 'разные объекты'}

Горячие клиенты вчера (упомяни 1–2 самых интересных, не всех):
${hot}

${emptyHint}

Структура нарратива (300 знаков на блок):
1) Главный факт дня (1–2 предложения).
2) Один конкретный горячий клиент с прямой цитатой и рекомендация что сделать (например «созвонись лично»).
3) Команда — кто молодец и над чем подумать (без обвинений).
4) Заключение — что ты подсветишь к концу дня.

Верни ТОЛЬКО сам текст нарратива, без префиксов, без кавычек, без «Вот нарратив:».`;
}

export async function generateMorningNarrative(stats: NarratorStats): Promise<{
  text: string;
  costUsd: number;
  latencyMs: number;
}> {
  const start = Date.now();
  const client = getOpenRouterClient();
  const prompt = buildNarratorPrompt(stats);

  const res = await client.chat.completions.create({
    model: 'moonshotai/kimi-k2',
    messages: [
      {
        role: 'system',
        content:
          'Ты пишешь утренний устный нарратив для главы агентства недвижимости. Естественная речь, без markdown.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 400,
    // Pin provider to Novita (kimi-k2 quirk, see hq memory).
    // OpenRouter accepts `provider` at top-level via OpenAI SDK loose-body cast.
    provider: { order: ['Novita'], allow_fallbacks: false },
  } as never);

  const text = res.choices[0]?.message?.content?.trim() || '';
  const usage = res.usage;
  const costUsd = usage
    ? (usage.prompt_tokens / 1_000_000) * 0.4 +
      (usage.completion_tokens / 1_000_000) * 0.8
    : 0;

  return { text, costUsd, latencyMs: Date.now() - start };
}
