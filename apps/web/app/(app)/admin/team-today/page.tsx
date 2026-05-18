import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { agentSettings, agendaEvents, db, users } from '@estateos/db';
import { requireAdmin } from '@/lib/auth-server';
import { mskDayBounds } from '@/lib/time';

export const dynamic = 'force-dynamic';

type AgendaEventRow = typeof agendaEvents.$inferSelect;
type EventStatus = AgendaEventRow['status'];

const STATUS_LABEL: Record<EventStatus, string> = {
  planned: 'запланировано',
  in_progress: 'в работе',
  done: 'завершено',
  cancelled: 'отменено',
};

const STATUS_COLOR: Record<EventStatus, string> = {
  planned: '#3B82F6',
  in_progress: '#D4A84C',
  done: 'var(--success)',
  cancelled: '#C46B82',
};

function initials(s?: string | null): string {
  if (!s) return '·';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function agentName(agent: Pick<typeof users.$inferSelect, 'firstName' | 'lastName' | 'email'>) {
  const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ').trim();
  return name || agent.email;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

export default async function TeamTodayPage() {
  const admin = await requireAdmin();
  const { mskStart: start, mskEnd: end, todayStr: today } = mskDayBounds();

  const [agents, events, settings] = await Promise.all([
    db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, admin.organizationId),
          eq(users.role, 'agent'),
          eq(users.isActive, true)
        )
      )
      .orderBy(asc(users.firstName), asc(users.email)),
    db
      .select()
      .from(agendaEvents)
      .where(
        and(
          eq(agendaEvents.organizationId, admin.organizationId),
          gte(agendaEvents.scheduledAt, start),
          lt(agendaEvents.scheduledAt, end)
        )
      )
      .orderBy(asc(agendaEvents.scheduledAt)),
    db
      .select({ setting: agentSettings })
      .from(agentSettings)
      .innerJoin(users, eq(agentSettings.userId, users.id))
      .where(eq(users.organizationId, admin.organizationId)),
  ]);

  const activeAgentIds = new Set(agents.map((agent) => agent.id));
  const settingsByAgent = new Map(settings.map(({ setting }) => [setting.userId, setting]));
  const eventsByAgent = new Map<string, AgendaEventRow[]>();
  const totals = { planned: 0, inProgress: 0, done: 0, cancelled: 0 };

  for (const event of events) {
    if (!activeAgentIds.has(event.agentId)) continue;

    const existing = eventsByAgent.get(event.agentId);
    if (existing) {
      existing.push(event);
    } else {
      eventsByAgent.set(event.agentId, [event]);
    }

    if (event.status === 'planned') totals.planned++;
    if (event.status === 'in_progress') totals.inProgress++;
    if (event.status === 'done') totals.done++;
    if (event.status === 'cancelled') totals.cancelled++;
  }

  const totalEvents = totals.planned + totals.inProgress + totals.done + totals.cancelled;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Оперативная сводка</div>
          <h1 className="page-title">Команда сегодня</h1>
          <p className="page-subtitle">
            {agents.length} агентов · {totalEvents} событий сегодня · {totals.done} завершено ·{' '}
            {totals.planned + totals.inProgress} в плане · {totals.cancelled} отменено
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Нет активных агентов</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>
            Активные агенты появятся здесь после добавления в команду.
          </div>
        </div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {agents.map((agent) => {
            const agentEvents = eventsByAgent.get(agent.id) ?? [];
            const agentSettingsRow = settingsByAgent.get(agent.id);
            const isDayOff = agentSettingsRow?.dayOffDate === today;
            const done = agentEvents.filter((event) => event.status === 'done').length;
            const planned = agentEvents.filter((event) => event.status === 'planned' || event.status === 'in_progress').length;
            const cancelled = agentEvents.filter((event) => event.status === 'cancelled').length;

            return (
              <article key={agent.id} className="surface-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div className="agent-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>
                    {initials(agentName(agent))}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                      {agentName(agent)}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                      {done} завершено · {planned} в плане · {cancelled} отменено
                    </div>
                  </div>
                  {isDayOff && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--mono)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '4px 9px',
                        borderRadius: 999,
                        background: 'var(--bg-soft)',
                        color: 'var(--ink-3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      выходной
                    </span>
                  )}
                </div>

                {agentEvents.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '8px 0' }}>
                    Событий на сегодня нет.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {agentEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '44px 10px minmax(0, 1fr)',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>
                          {formatTime(event.scheduledAt)}
                        </div>
                        <span
                          aria-label={STATUS_LABEL[event.status]}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: STATUS_COLOR[event.status],
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--ink)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </div>
                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 11,
                              color: 'var(--ink-3)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {STATUS_LABEL[event.status]}{event.address ? ` · ${event.address}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
