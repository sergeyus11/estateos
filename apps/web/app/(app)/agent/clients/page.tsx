import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, clients } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { initials, avatarGradient, StatusChip } from './_shared';

export const dynamic = 'force-dynamic';

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
