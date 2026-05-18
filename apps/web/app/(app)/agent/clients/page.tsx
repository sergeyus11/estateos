import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, clients } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    new: { label: 'Новый', bg: 'var(--bg-soft)', color: 'var(--ink-3)' },
    active: { label: 'Активный', bg: '#E8F1E5', color: '#4E7A3C' },
    thinking: { label: 'Думает', bg: '#FAF1DD', color: '#8A6B1F' },
    negotiating: { label: 'Торгуется', bg: 'var(--brand-50)', color: 'var(--brand-700)' },
    closed_won: { label: 'Сделка', bg: '#E8F1E5', color: '#4E7A3C' },
    closed_lost: { label: 'Отказ', bg: '#FBE8E8', color: '#8a4949' },
  };
  const c = cfg[status] ?? cfg.new;

  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: 'var(--mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
      }}
    >
      {c.label}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #E2A98E, #9A6048)',
    'linear-gradient(135deg, #D4A84C, #9A7833)',
    'linear-gradient(135deg, #7A9E6B, #52784A)',
    'linear-gradient(135deg, #6B8EC4, #3E5A8C)',
    'linear-gradient(135deg, #B891C4, #6A4A8C)',
    'linear-gradient(135deg, #C46B82, #7A2E48)',
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return gradients[hash % gradients.length];
}

export default async function ClientsPage() {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch {
    redirect('/login');
  }

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, user.organizationId))
    .orderBy(desc(clients.updatedAt))
    .limit(200);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">База клиентов</div>
          <h1 className="page-title">Клиенты</h1>
          <p className="page-subtitle">{rows.length} клиентов</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-3)' }}>
          <p style={{ fontSize: 15 }}>Пока нет клиентов. Создавай голосом из FAB или через форму.</p>
        </div>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((client) => (
            <Link
              key={client.id}
              href={`/agent/clients/${client.id}` as never}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="surface-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(0, 1fr) auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="agent-avatar"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 14,
                    background: avatarGradient(client.name),
                  }}
                >
                  {initials(client.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                    {client.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-3)',
                      marginTop: 2,
                      fontFamily: 'var(--mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {client.phone ?? client.email ?? client.telegram ?? '—'}
                  </div>
                </div>
                <StatusChip status={client.status} />
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
