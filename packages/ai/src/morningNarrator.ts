import { llmChat } from './openrouter';

/* ============================================================
 *  Owner-Narrative stats type (Phase 2.5)
 *  Зеркало packages/db NarrativeStats. Дублируем тут чтобы AI-package
 *  не зависел от схемы — narrator может работать с любым source.
 * ============================================================ */

export type AgentTrendInput = {
  name: string;
  showsYesterday: number;
  showsWeek: number;
  showsPriorWeek: number;
  state: 'rising' | 'declining' | 'stable' | 'off';
  signal?: string;
};

export type TopRiskInput = {
  type: 'cold_followup' | 'stale_warm' | 'budget_unverified';
  description: string;
  statisticalContext?: string;
  actionDeadline?: string;
};

export type NarratorStats = {
  showsToday: number;
  showsYesterday: number;
  weekTotal: number;
  activeAgents: number;
  topAgent: { name: string; count: number } | null;
  topObject: string | null;
  hotProspects: Array<{ object: string; client: string; reaction: string }>;
  // Owner extras (все optional — narrator понимает их отсутствие)
  showsPriorDay?: number;
  weekPriorTotal?: number;
  avgBudget?: number;
  finalReportsYesterday?: number;
  prospectMix?: { hot: number; warm: number; recon: number };
  agentTrends?: AgentTrendInput[];
  pipeline7d?: { activeReports: number; finalizedShare: number };
  topRisk?: TopRiskInput | null;
};

function fmtMoneyShort(rub: number): string {
  if (rub >= 1_000_000_000) return `${(rub / 1_000_000_000).toFixed(1)} млрд ₽`;
  if (rub >= 1_000_000) return `${Math.round(rub / 1_000_000)} млн ₽`;
  if (rub >= 1_000) return `${Math.round(rub / 1_000)} тыс ₽`;
  return `${rub} ₽`;
}

function fmtPct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function dayOverDay(today: number, prior: number): string {
  if (prior === 0 && today === 0) return 'на уровне предыдущего дня';
  if (prior === 0) return `${today} (вчера было пусто)`;
  const delta = today - prior;
  if (delta === 0) return `столько же, сколько позавчера`;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} к позавчера (${prior})`;
}

function weekOverWeek(week: number, prior: number): string {
  if (prior === 0 && week === 0) return 'пусто в обе недели';
  if (prior === 0) return `${week} (на прошлой неделе было пусто)`;
  const pct = Math.round(((week - prior) / prior) * 100);
  const sign = pct > 0 ? '+' : '';
  return `${week} показов · ${sign}${pct}% к прошлой неделе (${prior})`;
}

export function buildNarratorPrompt(stats: NarratorStats): string {
  const yest = stats.showsYesterday;
  const hot = stats.hotProspects.length;
  const isEmpty = yest === 0;

  // — секция «Команда»
  const team = stats.agentTrends ?? [];
  const rising = team.filter((a) => a.state === 'rising');
  const declining = team.filter((a) => a.state === 'declining');
  const off = team.filter((a) => a.state === 'off');
  const stable = team.filter((a) => a.state === 'stable');

  const teamBlock = team.length
    ? [
        rising.length
          ? `Подъём: ${rising.map((a) => `${a.name} — ${a.signal ?? 'неделя сильнее'}`).join('; ')}.`
          : '',
        declining.length
          ? `Спад: ${declining.map((a) => `${a.name} — ${a.signal ?? 'снижение активности'}`).join('; ')}.`
          : '',
        off.length
          ? `Без активности: ${off.map((a) => a.name).join(', ')} (возможно, отгул).`
          : '',
        stable.length && team.length <= 6
          ? `Стабильно: ${stable.map((a) => a.name).join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '(per-agent данных пока нет)';

  // — секция «Pipeline»
  const pipeline = stats.pipeline7d
    ? `В работе за последние 7 дней: ${stats.pipeline7d.activeReports} показов, финализировано ${fmtPct(stats.pipeline7d.finalizedShare)}.`
    : '(pipeline-данных пока нет)';

  const wow =
    stats.weekPriorTotal !== undefined
      ? weekOverWeek(stats.weekTotal, stats.weekPriorTotal)
      : `${stats.weekTotal} показов за неделю`;
  const dod =
    stats.showsPriorDay !== undefined
      ? dayOverDay(yest, stats.showsPriorDay)
      : `${yest} показов вчера`;

  const avgBudget = stats.avgBudget ? fmtMoneyShort(stats.avgBudget) : 'нет данных';
  const mix = stats.prospectMix
    ? `${stats.prospectMix.hot} горячих, ${stats.prospectMix.warm} тёплых, ${stats.prospectMix.recon} на разведку`
    : '(классификация недоступна)';

  // — секция «Риск»
  const risk = stats.topRisk
    ? `${stats.topRisk.description}${stats.topRisk.statisticalContext ? ' ' + stats.topRisk.statisticalContext : ''}${stats.topRisk.actionDeadline ? ' Дедлайн действия — ' + stats.topRisk.actionDeadline + '.' : ''}`
    : (hot > 0
        ? `Один горячий клиент вчера: ${stats.hotProspects[0].client} по ${stats.hotProspects[0].object} — реакция «${stats.hotProspects[0].reaction}». Стоит закрыть follow-up в первой половине дня.`
        : 'Критических рисков по вчерашним показам не вижу.');

  const emptyHint = isEmpty
    ? 'Вчера не было показов — это бывает. Скажи спокойно, без драматизации. Если есть тренд по команде или pipeline — сосредоточься на нём.'
    : '';

  return `Ты — утренний голос для **совладельца** агентства недвижимости. Каждое утро в 09:30 ты пересказываешь её вчерашний день за 100–140 секунд (≈260–320 слов). Тон: спокойный, тёплый, по делу, как доверенный зам-РОПа который говорит с собственником, а не с менеджером. Без эмодзи, без приветствий вроде «Доброе утро, дорогая», без markdown, без bullet-points, без заголовков. Естественная устная речь — представь что говоришь в микрофон, который запишут.

ВЧЕРАШНИЙ ДЕНЬ:
- Показов вчера: ${yest}, ${dod}
- За неделю: ${wow}
- Сегодня уже записано: ${stats.showsToday}
- Активных агентов в команде: ${stats.activeAgents}
- Mix вчерашних показов: ${mix}
- Средний бюджет показанных объектов: ${avgBudget}
- Финализированных отчётов из вчерашних: ${stats.finalReportsYesterday ?? 'нет данных'}

КОМАНДА (per-agent состояние за неделю):
${teamBlock}

PIPELINE:
${pipeline}

ОДИН ВАЖНЫЙ РИСК НА СЕГОДНЯ:
${risk}

${emptyHint}

СТРУКТУРА НАРРАТИВА (строго 5 секций, плавно перетекающие друг в друга в одной речи, не нумеруй):
1) **Цифры дня** (20–30 сек, ~50 слов): главное число, day-over-day и week-over-week одной фразой. Если есть финансовый контекст (средний бюджет, mix горячих/тёплых) — упомяни без бюрократии.
2) **Команда** (30–40 сек, ~70 слов): назови 2–3 агентов лично — кто на подъёме (с конкретной цифрой признания), кто на спаде (без обвинений, как наблюдение которое стоит проверить), кто в отгуле. Если команда стабильна — скажи это спокойно.
3) **Pipeline на ближайшие дни** (20–30 сек, ~45 слов): сколько в работе, доля закрытых, тон «прогноза» — где можем добрать, где провисаем.
4) **Один риск или одна возможность** (20 сек, ~40 слов): конкретный клиент / агент / объект, что делает риск острым, статистический контекст одной строкой. Если риска нет — скажи это и подсветь одну возможность.
5) **На сегодня — три действия максимум** (15–20 сек, ~40 слов): на трёх уровнях — (а) человеческий жест (поговорить с агентом лично), (б) операционный (звонок клиенту, решение по follow-up), (в) бизнес-наблюдение (на что глянуть в pipeline / аналитике).

Заверши коротко — без «Хорошего дня». Просто: «Идём работать» или «До завтра» или «Удачи сегодня».

Верни ТОЛЬКО сам текст нарратива, без префиксов, без кавычек, без «Вот нарратив:».`;
}

export async function generateMorningNarrative(stats: NarratorStats): Promise<{
  text: string;
  costUsd: number;
  latencyMs: number;
}> {
  const start = Date.now();
  const prompt = buildNarratorPrompt(stats);

  const BRIEF_SYSTEM = 'Ты пишешь утренний устный нарратив для совладельца агентства недвижимости. Естественная речь без markdown, плавно перетекающие предложения, без bullet-points. ~290 слов / 2 минуты звучания.';

  const text = await llmChat(BRIEF_SYSTEM, prompt, {
    task: 'brief',
    temperature: 0.55,
    maxTokens: 900,
  });

  return { text: text.trim(), costUsd: 0, latencyMs: Date.now() - start };
}
